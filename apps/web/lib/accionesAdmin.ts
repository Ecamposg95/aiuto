'use server'

import { revalidatePath } from 'next/cache'
import { prisma, type EstadoEmpresa } from '@aiuto/db'
import { auth } from '@/auth'
import { notificar, miembrosDe } from './notificaciones'

/** Empresas, licencias y usuarios: sólo el administrador. */
async function exigirAdmin(): Promise<{ id: string }> {
  const sesion = await auth()
  const id = sesion?.user?.id
  if (!id || sesion?.user?.rol !== 'STAFF_ADMIN') throw new Error('No autorizado.')
  return { id }
}

async function bitacora(actorId: string, entidad: string, entidadId: string, accion: string, datos?: object) {
  await prisma.auditLog.create({ data: { actorId, entidad, entidadId, accion, datos: datos ?? undefined } })
}

const texto = (d: FormData, k: string) => String(d.get(k) ?? '').trim()

const AVISO: Partial<Record<EstadoEmpresa, string>> = {
  APROBADA: 'Tu empresa ya está aprobada: puedes publicar vacantes',
  SUSPENDIDA: 'La cuenta de tu empresa fue suspendida',
  RECHAZADA: 'No pudimos aprobar la cuenta de tu empresa',
}

export async function cambiarEstadoEmpresa(datos: FormData) {
  const admin = await exigirAdmin()
  const id = texto(datos, 'id')
  const estado = texto(datos, 'estado') as EstadoEmpresa
  if (!['APROBADA', 'SUSPENDIDA', 'RECHAZADA'].includes(estado)) throw new Error('Estado inválido.')

  await prisma.company.update({ where: { id }, data: { estado, verificada: estado === 'APROBADA' } })
  await bitacora(admin.id, 'Company', id, `estado → ${estado}`)

  const aviso = AVISO[estado]
  if (aviso) await notificar(await miembrosDe(id), { titulo: aviso, ruta: '/reclutamiento' })

  revalidatePath('/panel/empresas')
}

/**
 * Asigna una licencia: cuántas vacantes abiertas a la vez y hasta cuándo.
 * Sin precio: las tarifas no están autorizadas (máster prompt §7.1).
 */
export async function asignarLicencia(datos: FormData) {
  const admin = await exigirAdmin()
  const companyId = texto(datos, 'companyId')
  const vacantesActivas = Number.parseInt(texto(datos, 'vacantesActivas'), 10)
  const terminaTexto = texto(datos, 'terminaEn')
  if (!Number.isInteger(vacantesActivas) || vacantesActivas < 1 || vacantesActivas > 500) {
    throw new Error('Las vacantes deben ser un entero entre 1 y 500.')
  }
  // La fecha llega como AAAA-MM-DD; la licencia vale hasta el final de ese día en México.
  const terminaEn = terminaTexto ? new Date(`${terminaTexto}T23:59:59-06:00`) : null
  if (terminaEn && Number.isNaN(terminaEn.getTime())) throw new Error('Fecha inválida.')

  // Una licencia activa a la vez: la nueva reemplaza a la anterior.
  await prisma.$transaction([
    prisma.licencia.updateMany({ where: { companyId, estado: 'ACTIVA' }, data: { estado: 'SUSPENDIDA' } }),
    prisma.licencia.create({
      data: { companyId, vacantesActivas, terminaEn, notaInterna: texto(datos, 'nota') || null },
    }),
  ])
  await bitacora(admin.id, 'Company', companyId, 'licencia asignada', { vacantesActivas, terminaEn })
  revalidatePath('/panel/empresas')
}

export async function suspenderLicencia(datos: FormData) {
  const admin = await exigirAdmin()
  const companyId = texto(datos, 'companyId')
  await prisma.licencia.updateMany({ where: { companyId, estado: 'ACTIVA' }, data: { estado: 'SUSPENDIDA' } })
  await bitacora(admin.id, 'Company', companyId, 'licencia suspendida')
  revalidatePath('/panel/empresas')
}

/** Atender o descartar una alerta. No decide nada por la empresa: sólo registra el seguimiento. */
export async function resolverAlerta(datos: FormData) {
  const admin = await exigirAdmin().catch(async () => {
    // Los operadores también dan seguimiento a las alertas.
    const sesion = await auth()
    if (sesion?.user?.id && sesion.user.rol === 'STAFF_OPERADOR') return { id: sesion.user.id }
    throw new Error('No autorizado.')
  })
  const id = texto(datos, 'id')
  const estado = texto(datos, 'estado') as 'ATENDIDA' | 'DESCARTADA'
  if (!['ATENDIDA', 'DESCARTADA'].includes(estado)) throw new Error('Estado inválido.')
  await prisma.alerta.update({
    where: { id },
    data: { estado, nota: texto(datos, 'nota') || null, atendidaEn: new Date(), atendidaPorId: admin.id },
  })
  await bitacora(admin.id, 'Alerta', id, `alerta → ${estado}`)
  revalidatePath('/panel/alertas')
}

// --------------------------------------------------------------- usuarios

const ROLES_EQUIPO = ['STAFF_ADMIN', 'STAFF_OPERADOR'] as const

/** Que nunca se quede el panel sin un administrador que pueda entrar. */
async function quedaOtroAdmin(sinContar: string): Promise<boolean> {
  const n = await prisma.user.count({
    where: { rol: 'STAFF_ADMIN', desactivadoEn: null, id: { not: sinContar } },
  })
  return n > 0
}

/**
 * Cambia el rol dentro del equipo (administración ↔ operación). No convierte a
 * un candidato o a una empresa en equipo ni al revés: eso cambia qué datos ve
 * la cuenta y se hace a mano, con `pnpm crear-staff`.
 */
export async function cambiarRolEquipo(datos: FormData) {
  const admin = await exigirAdmin()
  const id = texto(datos, 'id')
  const rol = texto(datos, 'rol') as (typeof ROLES_EQUIPO)[number]
  if (!ROLES_EQUIPO.includes(rol)) throw new Error('Rol inválido.')
  if (id === admin.id) throw new Error('No puedes cambiar tu propio rol.')

  const usuario = await prisma.user.findUniqueOrThrow({ where: { id }, select: { rol: true } })
  if (!(ROLES_EQUIPO as readonly string[]).includes(usuario.rol)) {
    throw new Error('Solo se cambia el rol de cuentas del equipo.')
  }
  if (usuario.rol === rol) return
  if (usuario.rol === 'STAFF_ADMIN' && !(await quedaOtroAdmin(id))) {
    throw new Error('Es el único administrador activo.')
  }

  await prisma.user.update({ where: { id }, data: { rol } })
  await bitacora(admin.id, 'User', id, `rol → ${rol}`, { antes: usuario.rol })
  revalidatePath('/panel/usuarios')
}

/**
 * Desactiva o reactiva una cuenta. Desactivada, no puede entrar y su sesión
 * abierta se corta en la siguiente petición (callback `jwt` de auth.ts). No se
 * borra nada: sus postulaciones, mensajes y vacantes se quedan como estaban.
 */
export async function cambiarActivacion(datos: FormData) {
  const admin = await exigirAdmin()
  const id = texto(datos, 'id')
  const activar = texto(datos, 'activar') === 'si'
  if (id === admin.id) throw new Error('No puedes desactivar tu propia cuenta.')

  const usuario = await prisma.user.findUniqueOrThrow({ where: { id }, select: { rol: true } })
  if (!activar && usuario.rol === 'STAFF_ADMIN' && !(await quedaOtroAdmin(id))) {
    throw new Error('Es el único administrador activo.')
  }

  await prisma.user.update({ where: { id }, data: { desactivadoEn: activar ? null : new Date() } })
  await bitacora(admin.id, 'User', id, activar ? 'cuenta reactivada' : 'cuenta desactivada')
  revalidatePath('/panel/usuarios')
}
