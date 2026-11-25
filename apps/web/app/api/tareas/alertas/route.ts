import { revisarInactividad } from '@/lib/alertas'

export const dynamic = 'force-dynamic'

/**
 * Alerta por inactividad de la empresa (máster prompt §11).
 *
 * Una vacante abierta con postulaciones, a la que nadie de la empresa ha
 * contactado en tres días hábiles desde la primera, genera una alerta en el
 * panel. Nunca por WhatsApp: se queda en AIUTO.
 *
 * Idempotente: hay una alerta por vacante. Si ya existe y sigue abierta, se
 * actualiza el conteo; si alguien ya la atendió, no se reabre. Si la empresa
 * contactó a alguien o la vacante se cerró, la alerta abierta se cierra sola.
 */
export async function POST(peticion: Request) {
  const esperado = process.env.TAREAS_SECRET
  if (!esperado) return Response.json({ error: 'Tarea no configurada.' }, { status: 503 })
  if (peticion.headers.get('authorization') !== `Bearer ${esperado}`) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }
  return Response.json(await revisarInactividad(new Date()))
}
