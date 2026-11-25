'use server'

import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@aiuto/db'
import { correoVerificar, correoAvisoEquipo, generarSlug } from '@aiuto/core'
import { signIn } from '@/auth'
import { esquemaRegistroEmpresa } from '@/lib/esquemas'
import { emitirFicha } from '@/lib/fichas'
import { enviarCorreo, basePublica, correoDelEquipo } from '@/lib/correo'
import { dentroDelLimite, origenDeCabeceras, traeElPaseEn } from '@/lib/limite'
import { notificar } from '@/lib/notificaciones'

export type EstadoRegistroEmpresa = {
  error?: string
  fallas?: { campo: string; mensaje: string }[]
  valores?: Record<string, string>
  intento?: number
}

/**
 * Alta de empresa: crea la empresa PENDIENTE y la cuenta de quien recluta.
 * No publica nada hasta que el administrador la aprueba y le asigna licencia.
 */
export async function registrarEmpresa(
  previo: EstadoRegistroEmpresa,
  datos: FormData,
): Promise<EstadoRegistroEmpresa> {
  const intento = (previo.intento ?? 0) + 1
  const crudo = Object.fromEntries([...datos.entries()].map(([k, v]) => [k, String(v)])) as Record<string, string>
  // La contraseña no se devuelve nunca.
  const { password: _p, ...valores } = crudo

  const leido = esquemaRegistroEmpresa.safeParse(crudo)
  if (!leido.success) {
    return {
      valores,
      intento,
      fallas: leido.error.issues.map((i) => ({ campo: String(i.path[0] ?? ''), mensaje: i.message })),
    }
  }
  const d = leido.data
  if (d.sitioWeb) return { valores, intento, error: 'No pudimos registrar la empresa.' }

  const h = await headers()
  const tope = dentroDelLimite(`registro:${origenDeCabeceras(h)}`, { maximo: 5, ventanaSegundos: 60 * 60 }, undefined, traeElPaseEn(h))
  if (!tope.permitido) {
    return { valores, intento, error: 'Demasiados registros desde esta conexión. Inténtalo más tarde.' }
  }

  if (await prisma.user.findUnique({ where: { email: d.correo } })) {
    return { valores, intento, fallas: [{ campo: 'correo', mensaje: 'Ya hay una cuenta con ese correo.' }] }
  }

  let slug = generarSlug(d.empresa)
  if (await prisma.company.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`

  const passwordHash = await bcrypt.hash(d.password, 12)
  const empresa = await prisma.company.create({
    data: {
      nombre: d.empresa,
      slug,
      sitio: d.sitio || null,
      ubicacion: d.ubicacion,
      descripcion: d.descripcion || null,
      estado: 'PENDIENTE',
      contactoNombre: d.nombre,
      contactoCorreo: d.correo,
      contactoTel: d.telefono || null,
      miembros: {
        create: {
          puesto: d.puesto || null,
          user: { create: { email: d.correo, nombre: d.nombre, rol: 'EMPRESA', passwordHash } },
        },
      },
    },
  })

  const ficha = await emitirFicha('verificar', d.correo)
  await enviarCorreo(correoVerificar({ nombre: d.nombre, liga: `${basePublica()}/verificar/${ficha}` }), {
    correo: d.correo,
    nombre: d.nombre,
  })

  // Al equipo: hay una empresa esperando aprobación.
  const admins = await prisma.user.findMany({ where: { rol: 'STAFF_ADMIN' }, select: { id: true } })
  await notificar(
    admins.map((a) => a.id),
    { titulo: `${empresa.nombre} pide entrar a la bolsa`, cuerpo: `${d.nombre} · ${d.correo}`, ruta: '/panel/empresas' },
  )
  const equipo = correoDelEquipo()
  if (equipo) {
    await enviarCorreo(
      correoAvisoEquipo({
        titulo: 'Empresa por aprobar',
        detalle: empresa.nombre,
        campos: [['Contacto', `${d.nombre} <${d.correo}>`], ['Ciudad', d.ubicacion]],
        liga: `${basePublica()}/panel/empresas`,
      }),
      equipo,
    )
  }

  await signIn('credentials', { email: d.correo, password: d.password, redirectTo: '/reclutamiento' })
  return {}
}
