'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@aiuto/db'
import { auth } from '@/auth'

/** Guarda o quita una vacante de la lista del candidato. */
export async function alternarGuardada(datos: FormData) {
  const sesion = await auth()
  if (!sesion?.user?.id || sesion.user.rol !== 'CANDIDATO') throw new Error('No autorizado.')
  const vacanteId = String(datos.get('vacanteId') ?? '')
  const perfil = await prisma.candidateProfile.findUnique({ where: { userId: sesion.user.id }, select: { id: true } })
  if (!perfil) throw new Error('Sin perfil.')

  const clave = { perfilId_vacanteId: { perfilId: perfil.id, vacanteId } }
  const ya = await prisma.vacanteGuardada.findUnique({ where: clave })
  if (ya) {
    await prisma.vacanteGuardada.delete({ where: clave })
  } else {
    // Sólo se guardan vacantes que existen; la FK lo garantiza.
    await prisma.vacanteGuardada.create({ data: { perfilId: perfil.id, vacanteId } })
  }
  revalidatePath('/mi/guardadas')
  revalidatePath('/bolsa/[slug]', 'page')
}
