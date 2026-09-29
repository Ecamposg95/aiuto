import { describe, it, expect } from 'vitest'
import {
  formatearSueldo,
  etiquetaModalidad,
  etiquetaSeguroSocial,
  diasRestantes,
} from '../src/formato.js'

describe('formatearSueldo', () => {
  it('muestra un rango cuando mínimo y máximo difieren', () => {
    expect(
      formatearSueldo({ sueldoMin: 32000, sueldoMax: 38000, moneda: 'MXN', periodicidad: 'MENSUAL' }),
    ).toBe('$32,000 – $38,000 MXN mensuales')
  })

  it('muestra una sola cifra cuando el sueldo es fijo', () => {
    expect(
      formatearSueldo({ sueldoMin: 24000, sueldoMax: 24000, moneda: 'MXN', periodicidad: 'MENSUAL' }),
    ).toBe('$24,000 MXN mensuales')
  })

  it('concuerda la periodicidad con el resto de la frase', () => {
    const base = { sueldoMin: 200, sueldoMax: 200, moneda: 'MXN' as const }
    expect(formatearSueldo({ ...base, periodicidad: 'POR_HORA' })).toBe('$200 MXN por hora')
    expect(formatearSueldo({ ...base, periodicidad: 'SEMANAL' })).toBe('$200 MXN semanales')
    expect(formatearSueldo({ ...base, periodicidad: 'QUINCENAL' })).toBe('$200 MXN quincenales')
    expect(formatearSueldo({ ...base, periodicidad: 'ANUAL' })).toBe('$200 MXN anuales')
  })
})

describe('etiquetaSeguroSocial', () => {
  it('nombra el caso completo sin porcentajes', () => {
    expect(etiquetaSeguroSocial('COMPLETO', 100)).toBe('IMSS sobre el sueldo completo')
  })

  it('dice el porcentaje exacto cuando es mixto', () => {
    expect(etiquetaSeguroSocial('MIXTO', 60)).toBe('IMSS sobre el 60 % del sueldo')
  })
})

describe('etiquetaModalidad', () => {
  it('traduce las tres modalidades', () => {
    expect(etiquetaModalidad('PRESENCIAL')).toBe('Presencial')
    expect(etiquetaModalidad('HIBRIDO')).toBe('Híbrido')
    expect(etiquetaModalidad('REMOTO')).toBe('Remoto')
  })
})

describe('diasRestantes', () => {
  const ahora = new Date('2026-01-10T12:00:00Z')

  it('cuenta los días que faltan', () => {
    expect(diasRestantes(new Date('2026-01-20T12:00:00Z'), ahora)).toBe(10)
  })

  it('redondea hacia arriba: una vacante que vence en unas horas todavía tiene un día', () => {
    expect(diasRestantes(new Date('2026-01-10T20:00:00Z'), ahora)).toBe(1)
  })

  it('devuelve cero cuando ya venció', () => {
    expect(diasRestantes(new Date('2026-01-01T12:00:00Z'), ahora)).toBe(0)
  })

  it('devuelve null si no hay fecha', () => {
    expect(diasRestantes(null, ahora)).toBeNull()
  })
})
