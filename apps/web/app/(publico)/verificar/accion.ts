'use server'

import { prisma } from '@aiuto/db'
import { consumirFicha } from '@/lib/fichas'

export type EstadoVerificar = { listo?: boolean; error?: string }

/**
 * Consume la ficha y liga lo postulado sin cuenta. Va en una acción y no en el
 * GET de la página: los clientes de correo (Outlook, Gmail) abren las ligas por
 * adelantado para revisarlas, y si el GET consumiera la ficha la quemarían
 * antes de que la persona la vea.
 */
export async function confirmarCorreo(_previo: EstadoVerificar, datos: FormData): Promise<EstadoVerificar> {
  const correo = await consumirFicha('verificar', String(datos.get('ficha') ?? ''))
  if (!correo) return { error: 'Esta liga no sirve o ya venció. Entra a tu cuenta y pide una nueva.' }

  const usuario = await prisma.user.update({
    where: { email: correo },
    data: { emailVerified: new Date() },
    include: { perfil: true },
  })
  // Ahora sí: el correo es suyo, y lo que postuló con él antes de tener cuenta es suyo.
  if (usuario.perfil) {
    await prisma.postulacion.updateMany({
      where: { correo, candidateProfileId: null },
      data: { candidateProfileId: usuario.perfil.id },
    })
  }
  return { listo: true }
}
