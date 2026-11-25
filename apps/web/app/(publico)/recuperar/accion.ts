'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@aiuto/db'
import { correoRestablecer } from '@aiuto/core'
import { enviarCorreo, basePublica } from '@/lib/correo'
import { emitirFicha, consumirFicha } from '@/lib/fichas'
import { dentroDelLimite, origenDeCabeceras, traeElPaseEn } from '@/lib/limite'
import { esquemaRegistro } from '@/lib/esquemas'

export type EstadoPedir = { enviado?: boolean; error?: string }

export async function pedirLiga(_previo: EstadoPedir, datos: FormData): Promise<EstadoPedir> {
  const h = await headers()
  const tope = dentroDelLimite(
    `recuperar:${origenDeCabeceras(h)}`,
    { maximo: 5, ventanaSegundos: 15 * 60 },
    undefined,
    traeElPaseEn(h),
  )
  if (!tope.permitido) return { error: 'Demasiados intentos. Espera unos minutos.' }

  const correo = String(datos.get('correo') ?? '').trim().toLowerCase()
  const usuario = correo ? await prisma.user.findUnique({ where: { email: correo } }) : null

  // La respuesta es la misma exista o no la cuenta: quien prueba correos al
  // azar no debe poder saber quién está registrado.
  if (usuario?.passwordHash) {
    const ficha = await emitirFicha('restablecer', correo)
    const liga = `${basePublica()}/recuperar/${ficha}`
    await enviarCorreo(correoRestablecer({ nombre: usuario.nombre, liga }), {
      correo,
      nombre: usuario.nombre ?? undefined,
    })
  }
  return { enviado: true }
}

export type EstadoNueva = { error?: string; intento?: number }

export async function ponerNueva(previo: EstadoNueva, datos: FormData): Promise<EstadoNueva> {
  const intento = (previo.intento ?? 0) + 1
  const leido = esquemaRegistro.shape.password.safeParse(datos.get('password'))
  if (!leido.success) return { error: leido.error.issues[0]?.message, intento }

  const correo = await consumirFicha('restablecer', String(datos.get('ficha') ?? ''))
  if (!correo) return { error: 'Esta liga ya no sirve. Pide una nueva.', intento }

  await prisma.user.update({
    where: { email: correo },
    // Quien recibe la liga en su correo demuestra que el correo es suyo.
    data: { passwordHash: await bcrypt.hash(leido.data, 12), emailVerified: new Date() },
  })
  redirect('/entrar?cambiada=1')
}
