import { prisma } from '@aiuto/db'
import { precioAsesoria, MONEDA_ASESORIA } from '@aiuto/core'
import { esquemaAsesoria } from '@/lib/esquemas'

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
    await prisma.solicitudAsesoria.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono || null,
        mensaje: datos.mensaje || null,
        nivel: datos.nivel,
        // El precio se congela aquí: si mañana suben las tarifas, a esta persona
        // se le sostiene lo que vio.
        precioMostrado: precioAsesoria(datos.nivel),
        moneda: MONEDA_ASESORIA,
      },
    })

    // TODO(correo): avisar a la dirección de AIUTO, que es quien cierra la venta.

    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('No se pudo guardar la solicitud de asesoría', error)
    return Response.json({ error: 'No pudimos guardar tu solicitud.' }, { status: 500 })
  }
}
