import { prisma } from '@aiuto/db'
import { correoHayAlgoNuevo } from '@aiuto/core'
import { enviarCorreos, basePublica } from './correo'

/**
 * Avisos dentro de la plataforma, con un correo que sólo invita a entrar.
 *
 * Como los demás avisos, se llama después de guardar y no lanza: si falla,
 * lo guardado se queda guardado.
 */
export async function notificar(
  userIds: readonly string[],
  aviso: { titulo: string; cuerpo?: string; ruta: string },
) {
  const unicos = [...new Set(userIds)]
  if (unicos.length === 0) return
  try {
    await prisma.notificacion.createMany({
      data: unicos.map((userId) => ({ userId, titulo: aviso.titulo, cuerpo: aviso.cuerpo, liga: aviso.ruta })),
    })
    const usuarios = await prisma.user.findMany({
      where: { id: { in: unicos } },
      select: { email: true, nombre: true },
    })
    await enviarCorreos(
      usuarios.map((u) => ({
        correo: correoHayAlgoNuevo({ nombre: u.nombre, titulo: aviso.titulo, liga: `${basePublica()}${aviso.ruta}` }),
        a: { correo: u.email, nombre: u.nombre ?? undefined },
      })),
    )
  } catch (e) {
    console.error('No se pudo notificar:', e)
  }
}

/** Las cuentas de una empresa, para avisarles. */
export async function miembrosDe(companyId: string): Promise<string[]> {
  const m = await prisma.companyMember.findMany({ where: { companyId }, select: { userId: true } })
  return m.map((x) => x.userId)
}

export async function sinLeer(userId: string): Promise<number> {
  return prisma.notificacion.count({ where: { userId, leidaEn: null } })
}

/** Marca como leídos los mensajes que le llegaron a quien abre la conversación. */
export async function marcarLeidos(postulacionId: string, lado: 'empresa' | 'candidato') {
  await prisma.mensaje.updateMany({
    where: { postulacionId, leidoEn: null, deEmpresa: lado === 'candidato' },
    data: { leidoEn: new Date() },
  })
}
