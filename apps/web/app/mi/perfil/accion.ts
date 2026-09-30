'use server'

import { prisma } from '@aiuto/db'
import { auth } from '@/auth'
import { esquemaPerfil } from '@/lib/esquemas'

export type EstadoPerfil = {
  guardado?: boolean
  fallas?: { campo: string; mensaje: string }[]
  /**
   * Lo que la persona acababa de escribir. Se devuelve para poder repintarlo:
   * sin esto, un error de validacion le borra todo lo que llevaba capturado.
   */
  valores?: Record<string, string>
  intento?: number
}

export async function guardarPerfil(previo: EstadoPerfil, datos: FormData): Promise<EstadoPerfil> {
  // El contador sube en cada intento fallido, para que la llave del formulario
  // cambie SIEMPRE. Con una llave derivada de los valores, dos intentos que
  // fallan igual no remontarian, y el segundo llegaria con lo del primero.
  const intento = (previo.intento ?? 0) + 1

  const sesion = await auth()
  const userId = sesion?.user?.id
  if (!userId) throw new Error('No autorizado.')

  const crudo = Object.fromEntries(
    [...datos.entries()].map(([k, v]) => [k, String(v)]),
  ) as Record<string, string>

  const leido = esquemaPerfil.safeParse(crudo)
  if (!leido.success) {
    return {
      valores: crudo,
      intento,
      fallas: leido.error.issues.map((i) => ({
        campo: String(i.path[0] ?? ''),
        mensaje: i.message,
      })),
    }
  }

  const d = leido.data
  const campos = {
    titular: d.titular || null,
    resumen: d.resumen || null,
    nivel: d.nivel,
    anosExperiencia: d.anosExperiencia,
    telefono: d.telefono || null,
    codigoPostal: d.codigoPostal || null,
    habilidades: (d.habilidades ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
    ligaPortafolio: d.ligaPortafolio || null,
    ligaVideo: d.ligaVideo || null,
    disponibilidad: d.disponibilidad || null,
  }

  await prisma.candidateProfile.upsert({
    where: { userId },
    create: { userId, ...campos },
    update: campos,
  })

  return { guardado: true, valores: crudo, intento }
}
