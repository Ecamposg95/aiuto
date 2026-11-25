import { describe, it, expect } from 'vitest'
import { VERTICALES } from '../src/soluciones.js'

describe('las siete verticales', () => {
  it('son siete, con slugs únicos', () => {
    expect(VERTICALES).toHaveLength(7)
    expect(new Set(VERTICALES.map((v) => v.slug)).size).toBe(7)
  })

  it('cada una trae entre seis y ocho soluciones (máster prompt §5)', () => {
    for (const v of VERTICALES) {
      expect(v.servicios.length, v.slug).toBeGreaterThanOrEqual(6)
      expect(v.servicios.length, v.slug).toBeLessThanOrEqual(8)
    }
  })

  it('cada solución dice qué problema resuelve', () => {
    for (const v of VERTICALES) for (const s of v.servicios) expect(s.resuelve.length, s.nombre).toBeGreaterThan(20)
  })

  it('cada una explica sus términos técnicos', () => {
    for (const v of VERTICALES) expect(v.glosario.length, v.slug).toBeGreaterThan(0)
  })
})
