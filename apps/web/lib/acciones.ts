'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma, type EstadoPostulacion, type Prisma } from '@aiuto/db'
import {
  validarVacante,
  calcularExpiracion,
  ampliarVigencia,
  generarSlug,
  puedeTransicionar,
  cierrePorVacanteCubierta,
  type DatosVacante,
  type Falla,
} from '@aiuto/core'
import { auth, esStaff, esEmpresa } from '@/auth'
import { avisarCambioDeEstado, avisarVacanteCerrada } from './avisos'
import { licenciaVigente } from './licencias'

/**
 * Quién actúa. El equipo AIUTO puede tocar cualquier vacante; una empresa,
 * sólo las suyas.
 *
 * Cada acción vuelve a comprobar la sesión. Los layouts ya la exigen, pero una
 * acción de servidor es un endpoint: se puede invocar sin pasar por la
 * pantalla que la contiene. La empresa se lee de la base, no del token.
 */
type Actor =
  | { id: string; tipo: 'staff' }
  | { id: string; tipo: 'empresa'; companyId: string; ruta: string }

async function exigirActor(): Promise<Actor> {
  const sesion = await auth()
  const id = sesion?.user?.id
  const rol = sesion?.user?.rol
  if (id && esStaff(rol)) return { id, tipo: 'staff' }
  if (id && esEmpresa(rol)) {
    const m = await prisma.companyMember.findUnique({ where: { userId: id }, include: { company: true } })
    if (m && m.company.estado === 'APROBADA') {
      return { id, tipo: 'empresa', companyId: m.companyId, ruta: '/reclutamiento' }
    }
  }
  throw new Error('No autorizado.')
}

async function exigirStaff(): Promise<{ id: string }> {
  const actor = await exigirActor()
  if (actor.tipo !== 'staff') throw new Error('No autorizado.')
  return actor
}

/** Raíz del panel de quien actúa, para revalidar y redirigir. */
const raiz = (actor: Actor) => (actor.tipo === 'staff' ? '/panel' : actor.ruta)

/**
 * La vacante, si quien actúa puede tocarla. Para una empresa, una vacante
 * ajena se comporta igual que una que no existe: no se confirma ni que exista.
 */
async function vacanteDe(actor: Actor, id: string) {
  const vacante = await prisma.vacante.findUnique({ where: { id } })
  if (!vacante) throw new Error('No existe.')
  if (actor.tipo === 'empresa' && vacante.companyId !== actor.companyId) throw new Error('No existe.')
  return vacante
}

/** ¿Le cabe a la empresa una vacante abierta más según su licencia? */
async function cabeOtraAbierta(companyId: string, sinContar?: string): Promise<string | null> {
  const licencia = await licenciaVigente(companyId)
  if (!licencia) return 'Tu empresa no tiene una licencia vigente. Escríbenos para activarla.'
  const abiertas = await prisma.vacante.count({
    where: { companyId, estado: 'ABIERTA', ...(sinContar ? { id: { not: sinContar } } : {}) },
  })
  if (abiertas >= licencia.vacantesActivas) {
    return `Tu licencia permite ${licencia.vacantesActivas} ${licencia.vacantesActivas === 1 ? 'vacante abierta' : 'vacantes abiertas'} a la vez. Cierra una para publicar otra.`
  }
  return null
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
  | { ok: false; fallas: Falla[]; valores: Record<string, string>; intento: number }

const texto = (d: FormData, k: string) => String(d.get(k) ?? '').trim()
const entero = (d: FormData, k: string) => Number.parseInt(String(d.get(k) ?? ''), 10)
/** Una lista capturada como renglones o separada por comas. */
const lista = (d: FormData, k: string) =>
  texto(d, k)
    .split(/[\n,]/)
    .map((c) => c.trim())
    .filter(Boolean)

/** Lee el formulario de vacante. Lo comparten crear y editar. */
function leerFormularioVacante(datos: FormData, actor: Actor) {
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

  // Lo que el máster prompt §7.1 suma a la ficha.
  const extra = {
    resultadosEsperados: texto(datos, 'resultadosEsperados') || null,
    requisitos: lista(datos, 'requisitos'),
    instrucciones: texto(datos, 'instrucciones') || null,
    sueldoNeto: datos.get('sueldoNeto') === 'si',
  }

  const fallas: Falla[] = []
  // La empresa no elige empresa: es la suya.
  if (actor.tipo === 'staff' && !nombreEmpresa) {
    fallas.push({ campo: 'empresa', mensaje: 'Escribe el nombre de la empresa.' })
  }
  if (!extra.resultadosEsperados) {
    fallas.push({ campo: 'resultadosEsperados', mensaje: 'Cuenta qué tiene que lograr quien ocupe el puesto.' })
  }
  if (!categoryId) fallas.push({ campo: 'categoryId', mensaje: 'Elige la categoría.' })

  const revisado = validarVacante(vacante)
  if (!revisado.ok) fallas.push(...revisado.fallas)

  return { crudo, nombreEmpresa, categoryId, vacante, extra, fallas }
}

/** La empresa de la vacante: la del actor, o la que capturó el equipo. */
async function empresaPara(actor: Actor, nombreEmpresa: string, ubicacion: string) {
  if (actor.tipo === 'empresa') {
    return prisma.company.findUniqueOrThrow({ where: { id: actor.companyId } })
  }
  const slugEmpresa = generarSlug(nombreEmpresa)
  return prisma.company.upsert({
    where: { slug: slugEmpresa },
    create: { slug: slugEmpresa, nombre: nombreEmpresa, ubicacion },
    update: {},
  })
}

export async function crearVacante(previo: ResultadoAccion, datos: FormData): Promise<ResultadoAccion> {
  const usuario = await exigirActor()
  const { crudo, nombreEmpresa, categoryId, vacante, extra, fallas } = leerFormularioVacante(datos, usuario)
  const publicar = datos.get('publicar') === 'si'
  if (fallas.length === 0 && publicar && usuario.tipo === 'empresa') {
    const motivo = await cabeOtraAbierta(usuario.companyId)
    if (motivo) fallas.push({ campo: 'publicar', mensaje: motivo })
  }
  if (fallas.length > 0) {
    // Sube en cada intento para que la llave del formulario cambie siempre.
    const intento = (previo.ok ? 0 : previo.intento) + 1
    return { ok: false, fallas, valores: crudo, intento }
  }

  // Para el equipo, la empresa se da de alta sola al capturar su primera
  // vacante (las empresas sin cuenta). Una empresa con cuenta publica a su nombre.
  const empresa = await empresaPara(usuario, nombreEmpresa, vacante.ubicacion)

  // El slug incluye la empresa para que dos vacantes del mismo puesto no choquen.
  let slug = generarSlug(vacante.puesto, empresa.nombre)
  if (await prisma.vacante.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const publicadaEn = publicar ? new Date() : null

  const creada = await prisma.vacante.create({
    data: {
      ...vacante,
      ...extra,
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

  revalidatePath(`${raiz(usuario)}/vacantes`)
  revalidatePath('/bolsa')
  redirect(`${raiz(usuario)}/vacantes`)
}

/**
 * Edita una vacante ya capturada.
 *
 * Se puede editar en cualquier estado: una vacante publicada con un dato mal
 * puesto tiene que poder corregirse, y dejarla congelada obligaria a bajarla y
 * volver a capturarla entera. Lo que NO cambia al editar es la fecha de
 * expiracion: editar no es republicar, y el reloj de la vigencia sigue corriendo
 * desde que se publico.
 */
export async function editarVacante(previo: ResultadoAccion, datos: FormData): Promise<ResultadoAccion> {
  const usuario = await exigirActor()
  const id = texto(datos, 'id')
  if (!id) throw new Error('Falta la vacante a editar.')
  await vacanteDe(usuario, id)

  const { crudo, nombreEmpresa, categoryId, vacante, extra, fallas } = leerFormularioVacante(datos, usuario)
  if (fallas.length > 0) {
    // Sube en cada intento para que la llave del formulario cambie siempre.
    const intento = (previo.ok ? 0 : previo.intento) + 1
    return { ok: false, fallas, valores: crudo, intento }
  }

  const empresa = await empresaPara(usuario, nombreEmpresa, vacante.ubicacion)

  await prisma.vacante.update({
    where: { id },
    data: { ...vacante, ...extra, companyId: empresa.id, categoryId },
  })

  await bitacora(usuario.id, 'Vacante', id, 'editada', { puesto: vacante.puesto })

  revalidatePath(`${raiz(usuario)}/vacantes`)
  revalidatePath('/bolsa')
  redirect(`${raiz(usuario)}/vacantes`)
}

export async function publicarVacante(datos: FormData) {
  const usuario = await exigirActor()
  const id = texto(datos, 'id')

  const vacante = await vacanteDe(usuario, id)
  if (vacante.estado !== 'BORRADOR') return
  if (usuario.tipo === 'empresa') {
    const motivo = await cabeOtraAbierta(usuario.companyId)
    if (motivo) throw new Error(motivo)
  }

  const publicadaEn = new Date()
  await prisma.vacante.update({
    where: { id },
    data: { estado: 'ABIERTA', publicadaEn, expiraEn: calcularExpiracion(publicadaEn) },
  })

  await bitacora(usuario.id, 'Vacante', id, 'publicada')
  revalidatePath(`${raiz(usuario)}/vacantes`)
  revalidatePath('/bolsa')
}

/**
 * Cierra una vacante que ya no está vigente sin haberse cubierto aquí. Igual
 * que al cubrirla, a quien seguía esperando se le avisa.
 */
export async function cerrarVacante(datos: FormData) {
  const usuario = await exigirActor()
  const id = texto(datos, 'id')
  await vacanteDe(usuario, id)
  await cerrarConAviso(usuario, id, 'CERRADA')
}

/** La ampliación excepcional a 60 días. La decide el equipo AIUTO. */
export async function ampliarVacante(datos: FormData) {
  const usuario = await exigirStaff()
  const id = texto(datos, 'id')
  const vacante = await prisma.vacante.findUniqueOrThrow({ where: { id } })
  const r = ampliarVigencia(vacante)
  if (!r.ok) throw new Error(r.motivo)
  await prisma.vacante.update({ where: { id }, data: { expiraEn: r.expiraEn, ampliadaEn: new Date() } })
  await bitacora(usuario.id, 'Vacante', id, 'vigencia ampliada', { expiraEn: r.expiraEn.toISOString() })
  revalidatePath('/panel/vacantes')
}

/**
 * Marcar una vacante como cubierta cierra en cascada las postulaciones que
 * seguían abiertas: nadie se queda esperando una respuesta que ya no va a llegar.
 */
export async function marcarVacanteCubierta(datos: FormData) {
  const usuario = await exigirActor()
  const id = texto(datos, 'id')
  await vacanteDe(usuario, id)
  await cerrarConAviso(usuario, id, 'CUBIERTA')
}

async function cerrarConAviso(usuario: Actor, id: string, estado: 'CUBIERTA' | 'CERRADA') {
  const vacante = await prisma.vacante.findUniqueOrThrow({
    where: { id },
    include: {
      company: { select: { nombre: true } },
      postulaciones: {
        select: { id: true, estado: true, nombre: true, correo: true, tokenConsulta: true },
      },
    },
  })
  const { aCerrar } = cierrePorVacanteCubierta(vacante.postulaciones)
  const porCerrar = vacante.postulaciones.filter((p) => aCerrar.includes(p.id))

  await prisma.$transaction([
    prisma.vacante.update({
      where: { id },
      data: { estado, cerradaEn: new Date() },
    }),
    prisma.postulacion.updateMany({
      where: { id: { in: aCerrar } },
      data: { estado: 'VACANTE_CUBIERTA' },
    }),
  ])

  // Nadie se queda esperando una respuesta que ya no va a llegar.
  await avisarVacanteCerrada({ vacante, destinatarios: porCerrar })

  await bitacora(usuario.id, 'Vacante', id, estado === 'CUBIERTA' ? 'cubierta' : 'cerrada', {
    postulacionesCerradas: aCerrar.length,
  })
  revalidatePath(`${raiz(usuario)}/vacantes`)
  revalidatePath(`${raiz(usuario)}/postulaciones`)
  revalidatePath('/bolsa')
}

export async function cambiarEstadoPostulacion(datos: FormData) {
  const usuario = await exigirActor()
  const id = texto(datos, 'id')
  const nuevo = texto(datos, 'estado') as EstadoPostulacion

  const postulacion = await prisma.postulacion.findUniqueOrThrow({
    where: { id },
    include: { vacante: { include: { company: { select: { nombre: true } } } } },
  })
  if (usuario.tipo === 'empresa' && postulacion.vacante.companyId !== usuario.companyId) {
    throw new Error('No existe.')
  }
  if (!puedeTransicionar(postulacion.estado, nuevo)) {
    throw new Error(`Transición inválida: ${postulacion.estado} → ${nuevo}`)
  }

  await prisma.postulacion.update({ where: { id }, data: { estado: nuevo } })

  // Esto es el producto: mover una postulacion aqui es responderle a alguien.
  await avisarCambioDeEstado({
    nombre: postulacion.nombre,
    correo: postulacion.correo,
    estado: nuevo,
    token: postulacion.tokenConsulta,
    vacante: postulacion.vacante,
  })

  await bitacora(usuario.id, 'Postulacion', id, `estado → ${nuevo}`, {
    anterior: postulacion.estado,
  })
  revalidatePath(`${raiz(usuario)}/postulaciones`)
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
