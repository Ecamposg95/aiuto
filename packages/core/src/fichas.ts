import { createHash, randomBytes } from 'node:crypto'

/**
 * Fichas de un solo uso para las ligas que llegan por correo.
 *
 * En la base se guarda la huella, nunca la ficha. Quien consiga una copia de
 * la base —un respaldo filtrado, una consulta de más— no puede usar las ligas
 * que siguen pendientes, porque de la huella no se regresa a la ficha.
 */

export type Proposito = 'restablecer' | 'verificar'

export const VIGENCIA_MINUTOS: Record<Proposito, number> = {
  // Corta: quien pide recuperar está frente a la pantalla esperando el correo.
  restablecer: 60,
  // Larga: verificar no corre prisa y la gente revisa el correo cuando puede.
  verificar: 60 * 24 * 3,
}

export function identificador(proposito: Proposito, correo: string): string {
  return `${proposito}:${correo.trim().toLowerCase()}`
}

/** El correo detrás de un identificador, sólo si es del propósito pedido. */
export function correoDe(proposito: Proposito, identifier: string): string | null {
  const prefijo = `${proposito}:`
  return identifier.startsWith(prefijo) ? identifier.slice(prefijo.length) : null
}

export function huellaDe(ficha: string): string {
  return createHash('sha256').update(ficha).digest('hex')
}

export function nuevaFicha(proposito: Proposito, ahora: Date = new Date()) {
  const ficha = randomBytes(32).toString('base64url')
  return {
    ficha,
    huella: huellaDe(ficha),
    expira: new Date(ahora.getTime() + VIGENCIA_MINUTOS[proposito] * 60_000),
  }
}

export function vigente(expira: Date, ahora: Date = new Date()): boolean {
  return expira.getTime() > ahora.getTime()
}
