import { prisma } from '@aiuto/db'
import { evaluarInactividad } from '@aiuto/core'
import { notificar } from './notificaciones'

/** La revisión diaria de la alerta por inactividad. Ver api/tareas/alertas. */
export async function revisarInactividad(ahora: Date) {
  const vacantes = await prisma.vacante.findMany({
    where: { estado: 'ABIERTA', postulaciones: { some: {} } },
    select: {
      id: true,
      puesto: true,
      companyId: true,
      company: { select: { nombre: true } },
      postulaciones: { select: { creadoEn: true, contactadaEn: true } },
      alertas: { where: { tipo: 'EMPRESA_SIN_CONTACTO' }, select: { id: true, estado: true } },
    },
  })

  let nuevas = 0
  let actualizadas = 0
  let resueltas = 0
  const avisar: string[] = []

  for (const v of vacantes) {
    const r = evaluarInactividad(v.postulaciones, ahora)
    const previa = v.alertas[0]

    if (!r.alertar) {
      // Si había contacto y la alerta seguía abierta, ya no hace falta.
      if (previa?.estado === 'ABIERTA' && v.postulaciones.some((p) => p.contactadaEn)) {
        await prisma.alerta.update({
          where: { id: previa.id },
          data: { estado: 'ATENDIDA', atendidaEn: ahora, nota: 'Se resolvió sola: la empresa contactó a alguien.' },
        })
        resueltas++
      }
      continue
    }

    if (!previa) {
      await prisma.alerta.create({
        data: {
          tipo: 'EMPRESA_SIN_CONTACTO',
          vacanteId: v.id,
          companyId: v.companyId,
          primeraPostulacionEn: r.primeraPostulacionEn,
          postulados: r.postulados,
        },
      })
      nuevas++
      avisar.push(`${v.company.nombre} · ${v.puesto}`)
    } else if (previa.estado === 'ABIERTA') {
      await prisma.alerta.update({ where: { id: previa.id }, data: { postulados: r.postulados } })
      actualizadas++
    }
  }

  // Las alertas abiertas de vacantes que ya no están abiertas se cierran solas.
  const cerradas = await prisma.alerta.updateMany({
    where: { estado: 'ABIERTA', vacante: { estado: { not: 'ABIERTA' } } },
    data: { estado: 'ATENDIDA', atendidaEn: ahora, nota: 'Se resolvió sola: la vacante ya no está abierta.' },
  })
  resueltas += cerradas.count

  if (avisar.length > 0) {
    const equipo = await prisma.user.findMany({
      where: { rol: { in: ['STAFF_ADMIN', 'STAFF_OPERADOR'] } },
      select: { id: true },
    })
    await notificar(
      equipo.map((u) => u.id),
      {
        titulo: avisar.length === 1 ? 'Una vacante lleva 3 días hábiles sin contacto' : `${avisar.length} vacantes llevan 3 días hábiles sin contacto`,
        cuerpo: avisar.join('\n'),
        ruta: '/panel/alertas',
      },
    )
  }

  console.log(`Alertas: ${nuevas} nuevas, ${actualizadas} actualizadas, ${resueltas} resueltas solas.`)
  return { ok: true, nuevas, actualizadas, resueltas }
}
