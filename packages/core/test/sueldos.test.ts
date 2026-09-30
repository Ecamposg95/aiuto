import { describe, it, expect } from 'vitest'
import { aMensual, resumirSueldos, MUESTRA_MINIMA } from '../src/sueldos.js'

const m = (min: number, max: number, periodicidad = 'MENSUAL' as const) => ({
  sueldoMin: min,
  sueldoMax: max,
  periodicidad,
})

describe('aMensual', () => {
  it('deja mensual como está', () => {
    expect(aMensual(30000, 'MENSUAL')).toBe(30000)
  })

  it('convierte quincenal, semanal y anual', () => {
    expect(aMensual(15000, 'QUINCENAL')).toBe(30000)
    expect(aMensual(120000, 'ANUAL')).toBe(10000)
    expect(aMensual(5000, 'SEMANAL')).toBe(21667)
  })

  it('convierte por hora con jornada de ley', () => {
    // 48 horas por semana es la jornada máxima legal en México.
    expect(aMensual(100, 'POR_HORA')).toBe(20800)
  })

  it('redondea a pesos enteros: un sueldo con centavos es ruido', () => {
    expect(Number.isInteger(aMensual(333, 'SEMANAL'))).toBe(true)
  })
})

describe('resumirSueldos', () => {
  it('no dice nada con muy pocas muestras', () => {
    const r = resumirSueldos([m(20000, 25000), m(30000, 35000)])
    expect(r.muestras).toBe(2)
    expect(r.suficiente).toBe(false)
  })

  it('resume cuando hay suficientes', () => {
    const r = resumirSueldos([m(10000, 20000), m(20000, 30000), m(30000, 40000)])
    expect(r.muestras).toBe(3)
    expect(r.suficiente).toBe(true)
    expect(r.min).toBe(10000)
    expect(r.max).toBe(40000)
  })

  it('la mediana usa el punto medio de cada rango', () => {
    // Medios: 15000, 25000, 35000 -> mediana 25000
    const r = resumirSueldos([m(10000, 20000), m(20000, 30000), m(30000, 40000)])
    expect(r.mediana).toBe(25000)
  })

  it('promedia los dos de en medio cuando la muestra es par', () => {
    // Medios: 10000, 20000, 30000, 40000 -> mediana 25000
    const r = resumirSueldos([m(10000, 10000), m(20000, 20000), m(30000, 30000), m(40000, 40000)])
    expect(r.mediana).toBe(25000)
  })

  it('normaliza periodicidades distintas antes de comparar', () => {
    const r = resumirSueldos([
      m(30000, 30000, 'MENSUAL'),
      m(15000, 15000, 'QUINCENAL'),
      m(360000, 360000, 'ANUAL'),
    ])
    expect(r.suficiente).toBe(true)
    // Las tres valen 30,000 al mes.
    expect(r.min).toBe(30000)
    expect(r.max).toBe(30000)
    expect(r.mediana).toBe(30000)
  })

  it('una muestra vacía no inventa números', () => {
    const r = resumirSueldos([])
    expect(r.muestras).toBe(0)
    expect(r.suficiente).toBe(false)
    expect(r.mediana).toBe(0)
  })

  it('el mínimo de muestra es el declarado', () => {
    const justo = Array.from({ length: MUESTRA_MINIMA }, () => m(20000, 20000))
    expect(resumirSueldos(justo).suficiente).toBe(true)
    expect(resumirSueldos(justo.slice(1)).suficiente).toBe(false)
  })
})
