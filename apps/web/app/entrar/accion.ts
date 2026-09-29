'use server'

import { AuthError } from 'next-auth'
import { prisma } from '@aiuto/db'
import { signIn, inicioSegunRol } from '@/auth'

export type EstadoEntrada = { error?: string }

export async function acceder(_previo: EstadoEntrada, datos: FormData): Promise<EstadoEntrada> {
  const email = String(datos.get('email') ?? '').trim().toLowerCase()

  // Se consulta el rol antes de entrar sólo para saber a dónde mandar a la
  // persona. Si el correo no existe, signIn falla igual y no se revela nada.
  const usuario = await prisma.user.findUnique({ where: { email }, select: { rol: true } })

  try {
    await signIn('credentials', {
      email,
      password: datos.get('password'),
      redirectTo: inicioSegunRol(usuario?.rol),
    })
    return {}
  } catch (e) {
    // Al entrar bien, signIn lanza una redirección de Next que NO es AuthError:
    // hay que dejarla pasar o el acceso se queda a medias.
    if (e instanceof AuthError) {
      return { error: 'Correo o contraseña incorrectos.' }
    }
    throw e
  }
}
