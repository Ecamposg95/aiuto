'use server'

import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@aiuto/db'
import { signIn } from '@/auth'
import { correoVerificar } from '@aiuto/core'
import { esquemaRegistro } from '@/lib/esquemas'
import { emitirFicha } from '@/lib/fichas'
import { enviarCorreo, basePublica } from '@/lib/correo'
import { dentroDelLimite, origenDeCabeceras, traeElPaseEn } from '@/lib/limite'

export type EstadoRegistro = {
  error?: string
  fallas?: { campo: string; mensaje: string }[]
  /**
   * Nombre y correo para repintarlos al rechazar. La contraseña NO se devuelve
   * nunca: no tiene por qué viajar de vuelta ni quedar en el HTML.
   */
  valores?: { nombre: string; correo: string }
  intento?: number
}

export async function registrar(
  previo: EstadoRegistro,
  datos: FormData,
): Promise<EstadoRegistro> {
  // El contador sube en cada intento fallido, para que la llave del formulario
  // cambie SIEMPRE. Con una llave derivada de los valores, dos intentos que
  // fallan igual no remontarian, y el segundo llegaria con lo del primero.
  const intento = (previo.intento ?? 0) + 1

  const valores = {
    nombre: String(datos.get('nombre') ?? ''),
    correo: String(datos.get('correo') ?? ''),
  }

  const leido = esquemaRegistro.safeParse({
    ...valores,
    password: datos.get('password'),
    sitioWeb: datos.get('sitioWeb'),
  })

  if (!leido.success) {
    return {
      valores,
      intento,
      fallas: leido.error.issues.map((i) => ({
        campo: String(i.path[0] ?? ''),
        mensaje: i.message,
      })),
    }
  }

  const { nombre, correo, password, sitioWeb } = leido.data
  if (sitioWeb) return { valores, intento, error: 'No pudimos crear la cuenta.' }

  // Cinco cuentas por hora y conexión. Va después de validar para que quien se
  // equivoca al capturar no gaste sus intentos.
  const h = await headers()
  const tope = dentroDelLimite(
    `registro:${origenDeCabeceras(h)}`,
    { maximo: 5, ventanaSegundos: 60 * 60 },
    undefined,
    traeElPaseEn(h),
  )
  if (!tope.permitido) {
    return { valores, intento, error: 'Demasiados registros desde esta conexión. Inténtalo más tarde.' }
  }

  const existente = await prisma.user.findUnique({ where: { email: correo } })
  if (existente) {
    return { valores, intento, fallas: [{ campo: 'correo', mensaje: 'Ya hay una cuenta con ese correo.' }] }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { email: correo, nombre, rol: 'CANDIDATO', passwordHash, perfil: { create: { nivel: 'EXPERIMENTADO' } } },
  })

  // Las postulaciones hechas sin cuenta se ligan al confirmar el correo, no
  // aquí: registrarse con un correo no prueba que sea de uno.
  const ficha = await emitirFicha('verificar', correo)
  await enviarCorreo(correoVerificar({ nombre, liga: `${basePublica()}/verificar/${ficha}` }), {
    correo,
    nombre,
  })

  // signIn lanza la redirección al tener éxito: se deja propagar.
  await signIn('credentials', { email: correo, password, redirectTo: '/mi/perfil' })
  return {}
}
