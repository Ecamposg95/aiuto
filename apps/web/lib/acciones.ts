'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma, type EstadoPostulacion, type Prisma } from '@aiuto/db'
import {
  validarVacante,
  calcularExpiracion,
  generarSlug,
  puedeTransicionar,
  cierrePorVacanteCubierta,
  type DatosVacante,
  type Falla,
} from '@aiuto/core'
import { auth, esStaff } from '@/auth'

/**
 * Cada acción vuelve a comprobar la sesión. El layout de /panel ya la exige,
 * pero una acción de servidor es un endpoint: se puede invocar sin pasar por
 * la pantalla que la contiene.
 */
async function exigirStaff(): Promise<{ id: string }> {
  const sesion = await auth()
  const id = sesion?.user?.id
  if (!id || !esStaff(sesion?.user?.rol)) {
    throw new Error('No autorizado.')
  }
  return { id }
}

async function bitacora(
  actorId: string,
  entidad: string,
  entidadId: string,
  accion: string,
  datos?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({ data: { actorId, entidad, entidadId, accion, datos } })
}

export type ResultadoAccion =
  | { ok: true }
  /**
   * `valores` es lo que se acababa de capturar. Se devuelve para repintarlo: son
   * catorce campos, y perderlos por un error de validacion obliga a capturar la
   * vacante entera otra vez.
   */
  | { ok: false; fallas: Falla[]; valores: Record<string, string> }

const texto = (d: FormData, k: string) => String(d.get(k) ?? '').trim()
const entero = (d: FormData, k: string) => Number.parseInt(String(d.get(k) ?? ''), 10)

export async function crearVacante(_previo: unknown, datos: FormData): Promise<ResultadoAccion> {
  const usuario = await exigirStaff()

  const crudo = Object.fromEntries(
    [...datos.entries()].map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>

  const nombreEmpresa = texto(datos, 'empresa')
  const categoryId = texto(datos, 'categoryId')

  const vacante: DatosVacante = {
    puesto: texto(datos, 'puesto'),
    descripcion: texto(datos, 'descripcion'),
    ubicacion: texto(datos, 'ubicacion'),
    modalidad: texto(datos, 'modalidad') as DatosVacante['modalidad'],
    sueldoMin: entero(datos, 'sueldoMin'),
    sueldoMax: entero(datos, 'sueldoMax'),
    periodicidad: texto(datos, 'periodicidad') as DatosVacante['periodicidad'],
    seguroSocial: texto(datos, 'seguroSocial') as DatosVacante['seguroSocial'],
    seguroSocialPct:
      texto(datos, 'seguroSocial') === 'COMPLETO' ? 100 : entero(datos, 'seguroSocialPct'),
    prestaciones: texto(datos, 'prestaciones'),
    horario: texto(datos, 'horario'),
    conocimientos: texto(datos, 'conocimientos')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean),
    numEntrevistas: entero(datos, 'numEntrevistas'),
    diasCierreEsperado: entero(datos, 'diasCierreEsperado'),
  }

  const fallas: Falla[] = []
  if (!nombreEmpresa) fallas.push({ campo: 'empresa', mensaje: 'Escribe el nombre de la empresa.' })
  if (!categoryId) fallas.push({ campo: 'categoryId', mensaje: 'Elige la categoría.' })

  const revisado = validarVacante(vacante)
  if (!revisado.ok) fallas.push(...revisado.fallas)
  if (fallas.length > 0) return { ok: false, fallas, valores: crudo }

  // La empresa se da de alta sola al capturar su primera vacante. En la Fase 1 no
  // se autoservicia ni tiene cuenta, así que un CRUD aparte sería una pantalla
  // que nadie pidió.
  const slugEmpresa = generarSlug(nombreEmpresa)
  const empresa = await prisma.company.upsert({
    where: { slug: slugEmpresa },
    create: { slug: slugEmpresa, nombre: nombreEmpresa, ubicacion: vacante.ubicacion },
    update: {},
  })

  // El slug incluye la empresa para que dos vacantes del mismo puesto no choquen.
  let slug = generarSlug(vacante.puesto, empresa.nombre)
  if (await prisma.vacante.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const publicar = datos.get('publicar') === 'si'
  const publicadaEn = publicar ? new Date() : null

  const creada = await prisma.vacante.create({
    data: {
      ...vacante,
      slug,
      companyId: empresa.id,
      categoryId,
      creadoPorId: usuario.id,
      estado: publicar ? 'ABIERTA' : 'BORRADOR',
      publicadaEn,
      expiraEn: publicadaEn ? calcularExpiracion(publicadaEn) : null,
    },
  })

  await bitacora(usuario.id, 'Vacante', creada.id, publicar ? 'creada y publicada' : 'creada', {
    puesto: creada.puesto,
  })

  revalidatePath('/panel/vacantes')
  revalidatePath('/bolsa')
  redirect('/panel/vacantes')
}

export async function publicarVacante(datos: FormData) {
  const usuario = await exigirStaff()
  const id = texto(datos, 'id')

  const vacante = await prisma.vacante.findUniqueOrThrow({ where: { id } })
  if (vacante.estado !== 'BORRADOR') return

  const publicadaEn = new Date()
  await prisma.vacante.update({
    where: { id },
    data: { estado: 'ABIERTA', publicadaEn, expiraEn: calcularExpiracion(publicadaEn) },
  })

  await bitacora(usuario.id, 'Vacante', id, 'publicada')
  revalidatePath('/panel/vacantes')
  revalidatePath('/bolsa')
}

/**
 * Marcar una vacante como cubierta cierra en cascada las postulaciones que
 * seguían abiertas: nadie se queda esperando una respuesta que ya no va a llegar.
 */
export async function marcarVacanteCubierta(datos: FormData) {
  const usuario = await exigirStaff()
  const id = texto(datos, 'id')

  const postulaciones = await prisma.postulacion.findMany({
    where: { vacanteId: id },
    select: { id: true, estado: true },
  })
  const { aCerrar } = cierrePorVacanteCubierta(postulaciones)

  await prisma.$transaction([
    prisma.vacante.update({
      where: { id },
      data: { estado: 'CUBIERTA', cerradaEn: new Date() },
    }),
    prisma.postulacion.updateMany({
      where: { id: { in: aCerrar } },
      data: { estado: 'VACANTE_CUBIERTA' },
    }),
  ])

  // TODO(correo): avisar en lote a quienes quedaron en VACANTE_CUBIERTA.

  await bitacora(usuario.id, 'Vacante', id, 'cubierta', { postulacionesCerradas: aCerrar.length })
  revalidatePath('/panel/vacantes')
  revalidatePath('/panel/postulaciones')
  revalidatePath('/bolsa')
}

export async function cambiarEstadoPostulacion(datos: FormData) {
  const usuario = await exigirStaff()
  const id = texto(datos, 'id')
  const nuevo = texto(datos, 'estado') as EstadoPostulacion

  const postulacion = await prisma.postulacion.findUniqueOrThrow({ where: { id } })
  if (!puedeTransicionar(postulacion.estado, nuevo)) {
    throw new Error(`Transición inválida: ${postulacion.estado} → ${nuevo}`)
  }

  await prisma.postulacion.update({ where: { id }, data: { estado: nuevo } })

  // TODO(correo): avisar al candidato. Es el motivo por el que existe el producto.

  await bitacora(usuario.id, 'Postulacion', id, `estado → ${nuevo}`, {
    anterior: postulacion.estado,
  })
  revalidatePath('/panel/postulaciones')
}

export async function cambiarEstadoSolicitud(datos: FormData) {
  const usuario = await exigirStaff()
  const id = texto(datos, 'id')
  const estado = texto(datos, 'estado') as 'NUEVA' | 'EN_PROCESO' | 'ATENDIDA' | 'CERRADA'

  await prisma.solicitud.update({
    where: { id },
    data: { estado, responsableId: usuario.id },
  })

  await bitacora(usuario.id, 'Solicitud', id, `estado → ${estado}`)
  revalidatePath('/panel')
}
