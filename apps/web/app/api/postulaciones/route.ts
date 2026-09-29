import { Prisma, prisma } from '@aiuto/db'
import { esquemaPostulacion } from '@/lib/esquemas'
import { VACANTE_PUBLICA } from '@/lib/consultas'

export const dynamic = 'force-dynamic'

export async function POST(peticion: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return Response.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const leido = esquemaPostulacion.safeParse(cuerpo)
  if (!leido.success) {
    const fallas = leido.error.issues.map((i) => ({
      campo: String(i.path[0] ?? ''),
      mensaje: i.message,
    }))
    return Response.json({ fallas }, { status: 422 })
  }

  const datos = leido.data

  // El honeypot venía lleno: es un robot. Se le responde como si todo hubiera
  // salido bien para no enseñarle qué lo delató.
  if (datos.sitioWeb) return Response.json({ ok: true }, { status: 201 })

  const vacante = await prisma.vacante.findFirst({
    where: { slug: datos.vacanteSlug, ...VACANTE_PUBLICA },
    select: { id: true, puesto: true },
  })
  if (!vacante) {
    return Response.json({ error: 'Esa vacante ya no está abierta.' }, { status: 404 })
  }

  try {
    const postulacion = await prisma.postulacion.create({
      data: {
        vacanteId: vacante.id,
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono || null,
        mensaje: datos.mensaje || null,
      },
      select: { tokenConsulta: true },
    })

    // TODO(correo): acuse al candidato con la liga de seguimiento y aviso al equipo.
    // Pendiente 4 de la spec: falta definir el proveedor de correo transaccional.

    return Response.json({ ok: true, token: postulacion.tokenConsulta }, { status: 201 })
  } catch (error) {
    // Una postulación por persona y vacante: la restricción única la garantiza.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return Response.json(
        { error: 'Ya te habías postulado a esta vacante con ese correo.' },
        { status: 409 },
      )
    }
    console.error('No se pudo guardar la postulación', error)
    return Response.json({ error: 'No pudimos guardar tu postulación.' }, { status: 500 })
  }
}
