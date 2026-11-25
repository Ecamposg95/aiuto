import { describe, it, expect } from 'vitest'
import { esHabil, feriados, sumarDiasHabiles } from '../src/habiles.js'

// Horas en el centro de México (UTC-6): las 10:00 de allá son las 16:00 UTC.
const mx = (fecha: string, hora = '10:00') => new Date(`${fecha}T${hora}:00-06:00`)

describe('días hábiles', () => {
  it('los feriados móviles caen en lunes', () => {
    const f = feriados(2027)
    expect(f.has('2027-02-01')).toBe(true) // primer lunes de febrero
    expect(f.has('2027-03-15')).toBe(true) // tercer lunes de marzo
    expect(f.has('2027-11-15')).toBe(true) // tercer lunes de noviembre
  })

  it('el 1 de octubre sólo en año de cambio de gobierno', () => {
    expect(feriados(2030).has('2030-10-01')).toBe(true)
    expect(feriados(2027).has('2027-10-01')).toBe(false)
  })

  it('el fin de semana y los feriados no son hábiles, en hora de México', () => {
    expect(esHabil(mx('2026-11-28'))).toBe(false) // sábado
    expect(esHabil(mx('2026-11-16'))).toBe(false) // tercer lunes de noviembre
    expect(esHabil(mx('2026-11-25'))).toBe(true) // miércoles
    // Viernes 23:30 en México ya es sábado en UTC, pero sigue siendo viernes allá
    expect(esHabil(mx('2026-11-27', '23:30'))).toBe(true)
  })

  it('lunes a las 10 más tres hábiles es jueves a las 10', () => {
    expect(sumarDiasHabiles(mx('2026-11-23'), 3).getTime()).toBe(mx('2026-11-26').getTime())
  })

  it('salta el fin de semana', () => {
    expect(sumarDiasHabiles(mx('2026-11-26'), 3).getTime()).toBe(mx('2026-12-01').getTime())
  })

  it('lo del sábado empieza a contar el lunes a las 00:00', () => {
    expect(sumarDiasHabiles(mx('2026-11-28', '15:00'), 3).getTime()).toBe(mx('2026-12-03', '00:00').getTime())
  })

  it('salta los feriados', () => {
    // Viernes 13 de noviembre de 2026; el lunes 16 es feriado
    expect(sumarDiasHabiles(mx('2026-11-13'), 1).getTime()).toBe(mx('2026-11-17').getTime())
    // Jueves 24 de diciembre: el 25 es feriado y luego viene el fin de semana
    expect(sumarDiasHabiles(mx('2026-12-24'), 1).getTime()).toBe(mx('2026-12-28').getTime())
  })
})
