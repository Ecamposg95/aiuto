import { prisma } from '@aiuto/db'
import { esquemaSolicitud } from '@/lib/esquemas'
import { avisarSolicitudNueva } from '@/lib/avisos'

export const dynamic = 'force-dynamic'

export async function POST(peticion: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const leido = esquemaSolicitud.safeParse(cuerpo)
  if (!leido.success) {
    const fallas = leido.error.issues.map((i) => ({
      campo: String(i.path[0] ?? ''),
      mensaje: i.message,
    }))
    return Response.json({ fallas }, { status: 422 })
  }

  const datos = leido.data
  if (datos.sitioWeb) return Response.json({ ok: true }, { status: 201 })

  const categoria = datos.categoriaSlug
    ? await prisma.category.findUnique({
        where: { slug: datos.categoriaSlug },
        select: { id: true, nombre: true },
      })
    : null

  try {
    await prisma.solicitud.create({
      data: {
        tipo: datos.tipo,
        categoryId: categoria?.id ?? null,
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono || null,
        empresa: datos.empresa || null,
        mensaje: datos.mensaje,
        origen: datos.origen,
      },
    })

    await avisarSolicitudNueva({
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      empresa: datos.empresa,
      mensaje: datos.mensaje,
      categoria: categoria?.nombre ?? null,
    })

    return Response.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('No se pudo guardar la solicitud', error)
    return Response.json({ error: 'No pudimos guardar tu mensaje.' }, { status: 500 })
  }
}
