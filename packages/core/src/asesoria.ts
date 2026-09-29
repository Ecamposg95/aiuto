/**
 * Asesoría de empleabilidad.
 *
 * Servicio humano que entrega la dirección general de AIUTO. El software sólo
 * capta y administra prospectos: el botón no cobra. Lo único que cambia entre
 * niveles es el precio.
 */
import type { NivelCandidato } from './tipos.js'

export const MONEDA_ASESORIA = 'MXN'

export const PRECIOS_ASESORIA: Record<NivelCandidato, number> = {
  ESTUDIANTE: 2500,
  EXPERIMENTADO: 3500,
  GERENCIA: 5000,
}

const ETIQUETAS: Record<NivelCandidato, string> = {
  ESTUDIANTE: 'Estudiante o recién egresado',
  EXPERIMENTADO: 'Persona con experiencia',
  GERENCIA: 'Gerencia o dirección',
}

/** Orden en que se pintan en el selector: de menor a mayor. */
const ORDEN: readonly NivelCandidato[] = ['ESTUDIANTE', 'EXPERIMENTADO', 'GERENCIA']

export function precioAsesoria(nivel: NivelCandidato): number {
  return PRECIOS_ASESORIA[nivel]
}

export function nivelesConPrecio(): { nivel: NivelCandidato; precio: number; etiqueta: string }[] {
  return ORDEN.map((nivel) => ({
    nivel,
    precio: PRECIOS_ASESORIA[nivel],
    etiqueta: ETIQUETAS[nivel],
  }))
}
