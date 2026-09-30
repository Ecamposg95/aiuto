/**
 * Resumen de sueldos a partir de las vacantes publicadas.
 *
 * La diferencia con lo que hacen otros sitios de sueldos: aquí el dato no lo
 * reportó un empleado de memoria, lo publicó la empresa en una vacante y se
 * comprometió a pagarlo. No hace falta estimar nada.
 *
 * A cambio, hay una obligación: **no presumir precisión que no existe**. Con
 * tres vacantes no se puede hablar de "el sueldo de mercado", así que por debajo
 * de la muestra mínima no se publica ningún número.
 */
import type { Periodicidad } from './tipos.js'

/** Debajo de esto no se muestra rango: sería fingir una precisión que no hay. */
export const MUESTRA_MINIMA = 3

/** Jornada máxima de ley en México: 48 horas por semana. */
const HORAS_SEMANA = 48
const SEMANAS_MES = 52 / 12

const FACTOR: Record<Periodicidad, number> = {
  POR_HORA: HORAS_SEMANA * SEMANAS_MES,
  SEMANAL: SEMANAS_MES,
  QUINCENAL: 2,
  MENSUAL: 1,
  ANUAL: 1 / 12,
}

/** Lleva cualquier periodicidad a pesos mensuales, para poder comparar. */
export function aMensual(monto: number, periodicidad: Periodicidad): number {
  return Math.round(monto * FACTOR[periodicidad])
}

export type MuestraSueldo = {
  sueldoMin: number
  sueldoMax: number
  periodicidad: Periodicidad
}

export type ResumenSueldos = {
  muestras: number
  /** Si es falso, no hay que mostrar los números: la muestra es muy chica. */
  suficiente: boolean
  min: number
  mediana: number
  max: number
}

const VACIO: ResumenSueldos = { muestras: 0, suficiente: false, min: 0, mediana: 0, max: 0 }

function medianaDe(valores: number[]): number {
  if (valores.length === 0) return 0
  const orden = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(orden.length / 2)
  return orden.length % 2 === 1
    ? orden[medio]!
    : Math.round((orden[medio - 1]! + orden[medio]!) / 2)
}

export function resumirSueldos(muestras: readonly MuestraSueldo[]): ResumenSueldos {
  if (muestras.length === 0) return VACIO

  const minimos = muestras.map((m) => aMensual(m.sueldoMin, m.periodicidad))
  const maximos = muestras.map((m) => aMensual(m.sueldoMax, m.periodicidad))
  // El punto medio de cada rango representa a esa vacante: usar sólo el mínimo
  // subestimaría, y sólo el máximo prometería de más.
  const medios = muestras.map((_, i) => Math.round((minimos[i]! + maximos[i]!) / 2))

  return {
    muestras: muestras.length,
    suficiente: muestras.length >= MUESTRA_MINIMA,
    min: Math.min(...minimos),
    mediana: medianaDe(medios),
    max: Math.max(...maximos),
  }
}
