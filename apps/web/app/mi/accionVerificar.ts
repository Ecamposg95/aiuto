'use server'

import { prisma } from '@aiuto/db'
import { correoVerificar } from '@aiuto/core'
import { exigirCandidato } from '@/lib/sesion'
import { emitirFicha } from '@/lib/fichas'
import { enviarCorreo, basePublica } from '@/lib/correo'
import { dentroDelLimite } from '@/lib/limite'

export type EstadoReenvio = { enviado?: boolean; error?: string }

/** Manda otra vez la liga para confirmar el correo. Tres por hora y cuenta. */
export async function reenviarVerificacion(_previo: EstadoReenvio): Promise<EstadoReenvio> {
  const { email: correo, nombre } = await exigirCandidato()

  const usuario = await prisma.user.findUnique({ where: { email: correo }, select: { emailVerified: true } })
  if (usuario?.emailVerified) return { enviado: true }

  const tope = dentroDelLimite(`reenviar:${correo}`, { maximo: 3, ventanaSegundos: 60 * 60 })
  if (!tope.permitido) return { error: 'Ya te mandamos varias. Espera un rato y revisa el correo no deseado.' }

  const ficha = await emitirFicha('verificar', correo)
  await enviarCorreo(
    correoVerificar({ nombre, liga: `${basePublica()}/verificar/${ficha}` }),
    { correo, nombre: nombre ?? undefined },
  )
  return { enviado: true }
}
