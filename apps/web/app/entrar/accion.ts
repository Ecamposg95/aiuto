'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type EstadoEntrada = { error?: string }

export async function acceder(_previo: EstadoEntrada, datos: FormData): Promise<EstadoEntrada> {
  try {
    await signIn('credentials', {
      email: datos.get('email'),
      password: datos.get('password'),
      redirectTo: '/panel',
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
