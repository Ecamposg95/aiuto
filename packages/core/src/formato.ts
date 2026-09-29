/**
 * Cómo se dicen las cosas de cara al usuario.
 *
 * Vive en `core` y no en la aplicación web porque el sueldo y el seguro social
 * son el argumento del producto: si mañana hay correos o una app móvil, tienen
 * que decirlo igual.
 */
import type { Modalidad, Periodicidad, SeguroSocial } from './tipos.js'

const PERIODICIDAD: Record<Periodicidad, string> = {
  POR_HORA: 'por hora',
  SEMANAL: 'semanales',
  QUINCENAL: 'quincenales',
  MENSUAL: 'mensuales',
  ANUAL: 'anuales',
}

const MODALIDAD: Record<Modalidad, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
}

const cifra = (n: number) => `$${n.toLocaleString('es-MX')}`

export function formatearSueldo(v: {
  sueldoMin: number
  sueldoMax: number
  moneda: string
  periodicidad: Periodicidad
}): string {
  const monto =
    v.sueldoMin === v.sueldoMax
      ? cifra(v.sueldoMin)
      : `${cifra(v.sueldoMin)} – ${cifra(v.sueldoMax)}`
  return `${monto} ${v.moneda} ${PERIODICIDAD[v.periodicidad]}`
}

export function etiquetaModalidad(m: Modalidad): string {
  return MODALIDAD[m]
}

export function etiquetaSeguroSocial(s: SeguroSocial, porcentaje: number): string {
  return s === 'COMPLETO'
    ? 'IMSS sobre el sueldo completo'
    : `IMSS sobre el ${porcentaje} % del sueldo`
}

const UN_DIA = 24 * 60 * 60 * 1000

/** Días que le quedan a una vacante. Se redondea hacia arriba: si vence hoy, queda 1. */
export function diasRestantes(expiraEn: Date | null, ahora: Date): number | null {
  if (expiraEn === null) return null
  const falta = expiraEn.getTime() - ahora.getTime()
  return falta <= 0 ? 0 : Math.ceil(falta / UN_DIA)
}
