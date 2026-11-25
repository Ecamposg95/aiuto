import { sumarDiasHabiles } from './habiles.js'

/** Días hábiles que una empresa tiene para contactar a alguien (máster prompt §11). */
export const DIAS_HABILES_SIN_CONTACTO = 3

export type PostulacionParaAlerta = { creadoEn: Date; contactadaEn: Date | null }

export type EvaluacionInactividad =
  | { alertar: false }
  | { alertar: true; primeraPostulacionEn: Date; postulados: number; venceEn: Date }

/**
 * ¿La vacante está desatendida?
 *
 * Sí cuando tiene al menos una postulación, ya pasaron tres días hábiles desde
 * la primera y la empresa no ha contactado a nadie. Basta un contacto con una
 * persona para que deje de considerarse desatendida: la regla no juzga si la
 * empresa revisa a todos, sólo si dio señales de vida.
 *
 * Es una herramienta de supervisión: no cierra nada ni decide por la empresa.
 */
export function evaluarInactividad(
  postulaciones: readonly PostulacionParaAlerta[],
  ahora: Date,
): EvaluacionInactividad {
  if (postulaciones.length === 0) return { alertar: false }
  if (postulaciones.some((p) => p.contactadaEn !== null)) return { alertar: false }

  const primeraPostulacionEn = new Date(Math.min(...postulaciones.map((p) => p.creadoEn.getTime())))
  const venceEn = sumarDiasHabiles(primeraPostulacionEn, DIAS_HABILES_SIN_CONTACTO)
  if (ahora.getTime() < venceEn.getTime()) return { alertar: false }

  return { alertar: true, primeraPostulacionEn, postulados: postulaciones.length, venceEn }
}
