'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@aiuto/db'
import { auth, esStaff, esEmpresa } from '@/auth'
import { notificar, miembrosDe } from './notificaciones'
import { dentroDelLimite } from './limite'

export type EstadoMensaje = { ok?: boolean; error?: string; intento?: number }

/**
 * La postulación, si quien escribe tiene que ver con ella:
 * - la empresa dueña de la vacante,
 * - el equipo AIUTO,
 * - la persona que se postuló, si la postulación está ligada a su perfil.
 * A cualquier otro se le contesta como si no existiera.
 */
async function postulacionPara(postulacionId: string) {
  const sesion = await auth()
  const id = sesion?.user?.id
  const rol = sesion?.user?.rol
  if (!id) return null

  const p = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    include: {
      vacante: { select: { puesto: true, companyId: true, company: { select: { nombre: true, estado: true } } } },
      candidato: { select: { userId: true } },
    },
  })
  if (!p) return null

  if (esStaff(rol)) return { p, autorId: id, lado: 'staff' as const }
  if (esEmpresa(rol)) {
    const m = await prisma.companyMember.findUnique({ where: { userId: id } })
    if (m && m.companyId === p.vacante.companyId && p.vacante.company.estado === 'APROBADA') {
      return { p, autorId: id, lado: 'empresa' as const }
    }
    return null
  }
  if (p.candidato?.userId === id) return { p, autorId: id, lado: 'candidato' as const }
  return null
}

export async function enviarMensaje(previo: EstadoMensaje, datos: FormData): Promise<EstadoMensaje> {
  const intento = (previo.intento ?? 0) + 1
  const postulacionId = String(datos.get('postulacionId') ?? '')
  const texto = String(datos.get('texto') ?? '').trim()

  if (!texto) return { error: 'Escribe el mensaje.', intento }
  if (texto.length > 4000) return { error: 'El mensaje es muy largo: 4,000 caracteres como máximo.', intento }

  const acceso = await postulacionPara(postulacionId)
  if (!acceso) return { error: 'No encontramos esta conversación.', intento }
  const { p, autorId, lado } = acceso

  // Treinta mensajes por hora y cuenta: una conversación real no llega ahí.
  const tope = dentroDelLimite(`mensaje:${autorId}`, { maximo: 30, ventanaSegundos: 60 * 60 })
  if (!tope.permitido) return { error: 'Mandaste muchos mensajes seguidos. Espera un momento.', intento }

  const deEmpresa = lado !== 'candidato'
  const ahora = new Date()
  await prisma.$transaction([
    prisma.mensaje.create({ data: { postulacionId, autorId, deEmpresa, texto } }),
    // El primer mensaje de la empresa es contacto efectivo: apaga la alerta.
    ...(deEmpresa && !p.contactadaEn
      ? [prisma.postulacion.update({ where: { id: postulacionId }, data: { contactadaEn: ahora } })]
      : []),
    // Si la empresa respondió a quien esperaba en RECIBIDA, ya lo está revisando.
    ...(deEmpresa && p.estado === 'RECIBIDA'
      ? [prisma.postulacion.update({ where: { id: postulacionId }, data: { estado: 'EN_REVISION' } })]
      : []),
  ])

  if (deEmpresa) {
    if (p.candidato?.userId) {
      await notificar([p.candidato.userId], {
        titulo: `Tienes un mensaje de ${p.vacante.company.nombre}`,
        cuerpo: p.vacante.puesto,
        ruta: `/mi/postulaciones/${postulacionId}`,
      })
    }
  } else {
    await notificar(await miembrosDe(p.vacante.companyId), {
      titulo: `${p.nombre} te respondió`,
      cuerpo: p.vacante.puesto,
      ruta: `/reclutamiento/postulaciones/${postulacionId}`,
    })
  }

  revalidatePath(`/reclutamiento/postulaciones/${postulacionId}`)
  revalidatePath(`/mi/postulaciones/${postulacionId}`)
  revalidatePath(`/panel/postulaciones`)
  return { ok: true, intento }
}

/**
 * La empresa contactó a la persona por otra vía (teléfono, correo). Cuenta
 * como contacto efectivo para la alerta de inactividad.
 */
export async function registrarContacto(datos: FormData) {
  const postulacionId = String(datos.get('postulacionId') ?? '')
  const acceso = await postulacionPara(postulacionId)
  if (!acceso || acceso.lado === 'candidato') throw new Error('No existe.')
  if (!acceso.p.contactadaEn) {
    await prisma.postulacion.update({ where: { id: postulacionId }, data: { contactadaEn: new Date() } })
    await prisma.auditLog.create({
      data: { actorId: acceso.autorId, entidad: 'Postulacion', entidadId: postulacionId, accion: 'contacto registrado' },
    })
  }
  revalidatePath(`/reclutamiento/postulaciones/${postulacionId}`)
}
