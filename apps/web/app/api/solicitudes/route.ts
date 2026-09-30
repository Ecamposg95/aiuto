import { prisma } from '@aiuto/db'
import { esquemaSolicitud } from '@/lib/esquemas'
import { avisarSolicitudNueva } from '@/lib/avisos'
import { cabecerasCors, responderPreflight } from '@/lib/cors'
import { dentroDelLimite, origenDe, demasiadasPeticiones } from '@/lib/limite'

/** Holgado: varias personas de una misma empresa pueden escribir el mismo día. */
const LIMITE = { maximo: 20, ventanaSegundos: 3600 }

export const dynamic = 'force-dynamic'

// La landing publicada en aiuto.com.mx escribe aquí desde otro dominio.
export async function OPTIONS(peticion: Request) {
  return responderPreflight(peticion)
}

export async function POST(peticion: Request) {
  const cors = cabecerasCors(peticion)
  const responder = (cuerpo: unknown, status: number) =>
    Response.json(cuerpo, { status, headers: cors })

  const limite = dentroDelLimite(`solicitud:${origenDe(peticion)}`, LIMITE)
  if (!limite.permitido) return demasiadasPeticiones(limite.esperaSegundos, cors)

  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return responder({ error: 'Cuerpo inválido.' }, 400)
  }

  const leido = esquemaSolicitud.safeParse(cuerpo)
  if (!leido.success) {
    const fallas = leido.error.issues.map((i) => ({
      campo: String(i.path[0] ?? ''),
      mensaje: i.message,
    }))
    return responder({ fallas }, 422)
  }

  const datos = leido.data
  if (datos.sitioWeb) return responder({ ok: true }, 201)

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

    return responder({ ok: true }, 201)
  } catch (error) {
    console.error('No se pudo guardar la solicitud', error)
    return responder({ error: 'No pudimos guardar tu mensaje.' }, 500)
  }
}
