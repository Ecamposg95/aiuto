import { prisma } from '@aiuto/db'
import { cierrePorVacanteCubierta } from '@aiuto/core'
import { avisarVacanteCerrada } from '@/lib/avisos'

export const dynamic = 'force-dynamic'

/**
 * Cierra las vacantes que pasaron de los 60 días y avisa a quienes postularon.
 *
 * La llama una tarea programada. Es idempotente: correrla de más no hace daño.
 * Se protege con un secreto compartido porque es una ruta pública que escribe.
 */
export async function POST(peticion: Request) {
  const esperado = process.env.TAREAS_SECRET
  if (!esperado) {
    return Response.json({ error: 'Tarea no configurada.' }, { status: 503 })
  }
  if (peticion.headers.get('authorization') !== `Bearer ${esperado}`) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const ahora = new Date()
  const vencidas = await prisma.vacante.findMany({
    where: { estado: 'ABIERTA', expiraEn: { lte: ahora } },
    select: {
      id: true,
      puesto: true,
      sueldoMin: true,
      sueldoMax: true,
      moneda: true,
      periodicidad: true,
      company: { select: { nombre: true } },
      postulaciones: {
        select: { id: true, estado: true, nombre: true, correo: true, tokenConsulta: true },
      },
    },
  })

  if (vencidas.length === 0) {
    return Response.json({ ok: true, cerradas: 0, postulacionesCerradas: 0 })
  }

  let postulacionesCerradas = 0
  let avisos = 0

  for (const v of vencidas) {
    const { aCerrar } = cierrePorVacanteCubierta(v.postulaciones)
    postulacionesCerradas += aCerrar.length
    const porCerrar = v.postulaciones.filter((p) => aCerrar.includes(p.id))

    await prisma.$transaction([
      prisma.vacante.update({
        where: { id: v.id },
        data: { estado: 'EXPIRADA', cerradaEn: ahora },
      }),
      prisma.postulacion.updateMany({
        where: { id: { in: aCerrar } },
        data: { estado: 'VACANTE_CUBIERTA' },
      }),
      prisma.auditLog.create({
        data: {
          entidad: 'Vacante',
          entidadId: v.id,
          accion: 'expirada automáticamente',
          datos: { puesto: v.puesto, postulacionesCerradas: aCerrar.length },
        },
      }),
    ])

    const r = await avisarVacanteCerrada({ vacante: v, destinatarios: porCerrar })
    avisos += r.enviados
  }

  console.log(
    `Cierre automático: ${vencidas.length} vacantes, ${postulacionesCerradas} postulaciones, ${avisos} avisos enviados.`,
  )
  return Response.json({ ok: true, cerradas: vencidas.length, postulacionesCerradas, avisos })
}
