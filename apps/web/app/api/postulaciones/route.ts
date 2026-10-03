import { Prisma, prisma } from '@aiuto/db'
import { auth } from '@/auth'
import { esquemaPostulacion } from '@/lib/esquemas'
import { vacantePublica } from '@/lib/consultas'
import { avisarPostulacionNueva } from '@/lib/avisos'

import { dentroDelLimite, origenDe, demasiadasPeticiones } from '@/lib/limite'

export const dynamic = 'force-dynamic'

/**
 * Generoso a propósito: postularse a varias vacantes en una sentada es lo que
 * hace alguien que busca trabajo en serio, y bloquearlo seria castigar el buen
 * uso. Contra el spam a una misma vacante ya está la restricción única de
 * (vacante, correo), que es mucho más precisa que un tope por IP.
 */
const LIMITE = { maximo: 30, ventanaSegundos: 3600 }

export async function POST(peticion: Request) {
  const limite = dentroDelLimite(`postulacion:${origenDe(peticion)}`, LIMITE, peticion)
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

  // Se comprueba antes de insertar. Dejarlo sólo al catch funciona, pero Prisma
  // registra la violación como `prisma:error` antes de que podamos atraparla, y
  // un caso de negocio esperado no debe verse como una falla en la bitácora:
  // llenarla de errores que no lo son entrena a ignorar los que sí.
  const yaSePostulo = await prisma.postulacion.findUnique({
    where: { vacanteId_correo: { vacanteId: vacante.id, correo: datos.correo } },
    select: { id: true },
  })
  if (yaSePostulo) {
    return Response.json(
      { error: 'Ya te habías postulado a esta vacante con ese correo.' },
      { status: 409 },
    )
  }

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
    // Red de seguridad para dos envíos simultáneos, que la comprobación de
    // arriba no alcanza a ver. La restricción de la base es la que manda.
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
