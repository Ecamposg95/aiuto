'use server'

import { headers } from 'next/headers'
import { AuthError } from 'next-auth'
import { prisma } from '@aiuto/db'
import { signIn, inicioSegunRol } from '@/auth'
import { dentroDelLimite, origenDeCabeceras, traeElPaseEn } from '@/lib/limite'

export type EstadoEntrada = { error?: string; intento?: number }

export async function acceder(previo: EstadoEntrada, datos: FormData): Promise<EstadoEntrada> {
  // El contador sube en cada intento fallido, para que la llave del formulario
  // cambie SIEMPRE. Con una llave derivada de los valores, dos intentos que
  // fallan igual no remontarian, y el segundo llegaria con lo del primero.
  const intento = (previo.intento ?? 0) + 1

  // Diez intentos cada quince minutos por IP. Sin esto, las cuentas del equipo
  // —que abren el panel con todos los datos personales— se pueden atacar a fuerza
  // bruta sin que nada lo frene.
  const h = await headers()
  const tope = dentroDelLimite(
    `entrar:${origenDeCabeceras(h)}`,
    { maximo: 10, ventanaSegundos: 15 * 60 },
    undefined,
    traeElPaseEn(h),
  )
  if (!tope.permitido) {
    return { error: `Demasiados intentos. Espera ${Math.ceil(tope.esperaSegundos / 60)} minutos.`, intento }
  }

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
      return { error: 'Correo o contraseña incorrectos.', intento }
    }
    throw e
  }
}
