import { describe, it, expect } from 'vitest'
import { evaluarInactividad } from '../src/alertas.js'

const mx = (fecha: string, hora = '10:00') => new Date(`${fecha}T${hora}:00-06:00`)
const post = (creado: string, contactada: string | null = null) => ({
  creadoEn: mx(creado),
  contactadaEn: contactada ? mx(contactada) : null,
})

describe('alerta por inactividad de la empresa', () => {
  it('sin postulaciones no hay nada que atender', () => {
    expect(evaluarInactividad([], mx('2026-12-31')).alertar).toBe(false)
  })

  it('no alerta antes de los tres días hábiles', () => {
    expect(evaluarInactividad([post('2026-11-23')], mx('2026-11-26', '09:59')).alertar).toBe(false)
  })

  it('alerta al cumplirse los tres días hábiles sin contacto', () => {
    const r = evaluarInactividad([post('2026-11-23'), post('2026-11-24')], mx('2026-11-26'))
    expect(r.alertar).toBe(true)
    if (r.alertar) {
      expect(r.postulados).toBe(2)
      expect(r.primeraPostulacionEn.getTime()).toBe(mx('2026-11-23').getTime())
    }
  })

  it('cuenta desde la PRIMERA postulación, no desde la última', () => {
    const r = evaluarInactividad([post('2026-11-25'), post('2026-11-20')], mx('2026-11-25'))
    expect(r.alertar).toBe(true)
  })

  it('basta contactar a una persona para no alertar', () => {
    const r = evaluarInactividad([post('2026-11-23'), post('2026-11-23', '2026-11-24')], mx('2026-12-10'))
    expect(r.alertar).toBe(false)
  })

  it('el fin de semana no cuenta', () => {
    // Jueves: vence el martes siguiente, no el domingo
    expect(evaluarInactividad([post('2026-11-26')], mx('2026-11-30')).alertar).toBe(false)
    expect(evaluarInactividad([post('2026-11-26')], mx('2026-12-01')).alertar).toBe(true)
  })
})
