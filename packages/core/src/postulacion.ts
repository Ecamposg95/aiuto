/**
 * Estados de una postulación.
 *
 * El motivo por el que existe AIUTO: en las demás bolsas aplicas y nunca sabes
 * qué pasó. Aquí cada transición es un correo al candidato, así que el grafo de
 * estados no es burocracia, es el producto.
 */
import type { EstadoPostulacion } from './tipos.js'

/** A dónde puede moverse cada estado. Los finales no se mueven. */
export const TRANSICIONES: Record<EstadoPostulacion, readonly EstadoPostulacion[]> = {
  RECIBIDA: ['EN_REVISION', 'RECHAZADA', 'VACANTE_CUBIERTA'],
  EN_REVISION: ['ENTREVISTA', 'RECHAZADA', 'VACANTE_CUBIERTA'],
  ENTREVISTA: ['CONTRATADA', 'RECHAZADA', 'VACANTE_CUBIERTA'],
  CONTRATADA: [],
  RECHAZADA: [],
  VACANTE_CUBIERTA: [],
}

export function transicionesDesde(estado: EstadoPostulacion): readonly EstadoPostulacion[] {
  return TRANSICIONES[estado]
}

export function puedeTransicionar(
  desde: EstadoPostulacion,
  hacia: EstadoPostulacion,
): boolean {
  return TRANSICIONES[desde].includes(hacia)
}

export function esEstadoFinal(estado: EstadoPostulacion): boolean {
  return TRANSICIONES[estado].length === 0
}

type PostulacionMinima = { id: string; estado: EstadoPostulacion }

/**
 * Cuando una vacante se marca como cubierta, todas las postulaciones que seguían
 * abiertas se cierran y se avisa en lote. A quien ya se le respondió no se le
 * vuelve a escribir.
 */
export function cierrePorVacanteCubierta(postulaciones: readonly PostulacionMinima[]): {
  aCerrar: string[]
  intactas: string[]
} {
  const aCerrar: string[] = []
  const intactas: string[] = []

  for (const p of postulaciones) {
    if (esEstadoFinal(p.estado)) intactas.push(p.id)
    else aCerrar.push(p.id)
  }

  return { aCerrar, intactas }
}
