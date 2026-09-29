import { prisma } from '@aiuto/db'
import { precioAsesoria, MONEDA_ASESORIA } from '@aiuto/core'
import { esquemaAsesoria } from '@/lib/esquemas'
import { avisarAsesoriaNueva } from '@/lib/avisos'

export const dynamic = 'force-dynamic'

export async function POST(peticion: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const leido = esquemaAsesoria.safeParse(cuerpo)
  if (!leido.success) {
    const fallas = leido.error.issues.map((i) => ({
      campo: String(i.path[0] ?? ''),
      mensaje: i.message,
    }))
    return Response.json({ fallas }, { status: 422 })
  }

  const datos = leido.data
  if (datos.sitioWeb) return Response.json({ ok: true }, { status: 201 })

  try {
    const precio = precioAsesoria(datos.nivel)

    await prisma.solicitudAsesoria.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono || null,
        mensaje: datos.mensaje || null,
        nivel: datos.nivel,
        // El precio se congela aquí: si mañana suben las tarifas, a esta persona
        // se le sostiene lo que vio.
        precioMostrado: precio,
        moneda: MONEDA_ASESORIA,
      },
    })

    await avisarAsesoriaNueva({
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      nivel: datos.nivel,
      precio,
      moneda: MONEDA_ASESORIA,
    })

    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('No se pudo guardar la solicitud de asesoría', error)
    return Response.json({ error: 'No pudimos guardar tu solicitud.' }, { status: 500 })
  }
}
