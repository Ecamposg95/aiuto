import { Prisma, prisma } from '@aiuto/db'
import { auth } from '@/auth'
import { esquemaPostulacion } from '@/lib/esquemas'
import { vacantePublica } from '@/lib/consultas'
import { avisarPostulacionNueva } from '@/lib/avisos'

import { dentroDelLimite, origenDe, demasiadasPeticiones } from '@/lib/limite'

export const dynamic = 'force-dynamic'

/** Suficiente para quien se equivoca y reintenta; corto para quien automatiza. */
const LIMITE = { maximo: 5, ventanaSegundos: 600 }

export async function POST(peticion: Request) {
  const limite = dentroDelLimite(`postulacion:${origenDe(peticion)}`, LIMITE)
  if (!limite.permitido) return demasiadasPeticiones(limite.esperaSegundos)

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
    where: { slug: datos.vacanteSlug, ...vacantePublica() },
    select: {
      id: true,
      puesto: true,
      sueldoMin: true,
      sueldoMax: true,
      moneda: true,
      periodicidad: true,
      company: { select: { nombre: true } },
    },
  })
  if (!vacante) {
    return Response.json({ error: 'Esa vacante ya no está abierta.' }, { status: 404 })
  }

  // Si hay sesion, la postulacion queda ligada al perfil y aparece en /mi sin
  // depender del correo que se haya escrito en el formulario.
  const sesion = await auth()
  const perfil = sesion?.user?.id
    ? await prisma.candidateProfile.findUnique({
        where: { userId: sesion.user.id },
        select: { id: true },
      })
    : null

  try {
    const postulacion = await prisma.postulacion.create({
      data: {
        vacanteId: vacante.id,
        candidateProfileId: perfil?.id ?? null,
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono || null,
        mensaje: datos.mensaje || null,
      },
      select: { tokenConsulta: true },
    })

    // Se avisa despues de guardar, y sin poder tumbar la respuesta: perder un
    // correo es malo, perder la postulacion porque el correo fallo seria peor.
    await avisarPostulacionNueva({
      nombre: datos.nombre,
      correo: datos.correo,
      telefono: datos.telefono,
      token: postulacion.tokenConsulta,
      vacante,
    })

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
