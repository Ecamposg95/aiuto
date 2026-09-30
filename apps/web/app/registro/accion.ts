'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@aiuto/db'
import { signIn } from '@/auth'
import { esquemaRegistro } from '@/lib/esquemas'

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

  const existente = await prisma.user.findUnique({ where: { email: correo } })
  if (existente) {
    return { valores, intento, fallas: [{ campo: 'correo', mensaje: 'Ya hay una cuenta con ese correo.' }] }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const usuario = await prisma.user.create({
    data: { email: correo, nombre, rol: 'CANDIDATO', passwordHash, perfil: { create: { nivel: 'EXPERIMENTADO' } } },
    include: { perfil: true },
  })

  // Quien ya se habia postulado sin cuenta se encuentra su historial al entrar:
  // las postulaciones se ligan por correo, que es lo unico que teniamos de esa
  // persona hasta ahora.
  if (usuario.perfil) {
    await prisma.postulacion.updateMany({
      where: { correo, candidateProfileId: null },
      data: { candidateProfileId: usuario.perfil.id },
    })
  }

  // signIn lanza la redirección al tener éxito: se deja propagar.
  await signIn('credentials', { email: correo, password, redirectTo: '/mi/perfil' })
  return {}
}
