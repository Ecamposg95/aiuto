import { prisma } from '@aiuto/db'
import { nuevaFicha, huellaDe, vigente, identificador, correoDe, type Proposito } from '@aiuto/core'

/** Emite una ficha nueva y anula las anteriores del mismo correo y propósito. */
export async function emitirFicha(proposito: Proposito, correo: string): Promise<string> {
  const id = identificador(proposito, correo)
  const f = nuevaFicha(proposito)
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: id } }),
    prisma.verificationToken.create({ data: { identifier: id, token: f.huella, expires: f.expira } }),
  ])
  return f.ficha
}

/**
 * Devuelve el correo si la ficha sirve. La borra siempre que la encuentra,
 * vencida o no: una liga se usa una vez, y una vencida no tiene por qué seguir
 * en la base.
 */
export async function consumirFicha(proposito: Proposito, ficha: string): Promise<string | null> {
  if (!ficha) return null
  const fila = await prisma.verificationToken.findUnique({ where: { token: huellaDe(ficha) } })
  if (!fila) return null
  // Una ficha de otro propósito no se toca: no es de este flujo.
  const correo = correoDe(proposito, fila.identifier)
  if (!correo) return null
  // deleteMany y no delete: si dos peticiones llegan a la vez, sólo una borra
  // la fila y sólo esa gana. La otra ve 0 y se va como si la liga no sirviera.
  const { count } = await prisma.verificationToken.deleteMany({ where: { token: fila.token } })
  if (count === 0 || !vigente(fila.expires)) return null
  return correo
}

/** ¿Existe la ficha y sigue vigente? No la consume: sirve para pintar el formulario. */
export async function fichaValida(proposito: Proposito, ficha: string): Promise<boolean> {
  if (!ficha) return false
  const fila = await prisma.verificationToken.findUnique({ where: { token: huellaDe(ficha) } })
  return Boolean(fila && vigente(fila.expires) && correoDe(proposito, fila.identifier))
}
