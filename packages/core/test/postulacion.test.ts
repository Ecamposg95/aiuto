import { describe, it, expect } from 'vitest'
import {
  puedeTransicionar,
  transicionesDesde,
  esEstadoFinal,
  cierrePorVacanteCubierta,
} from '../src/postulacion.js'

describe('transiciones de postulación', () => {
  it('avanza por el camino normal', () => {
    expect(puedeTransicionar('RECIBIDA', 'EN_REVISION')).toBe(true)
    expect(puedeTransicionar('EN_REVISION', 'ENTREVISTA')).toBe(true)
    expect(puedeTransicionar('ENTREVISTA', 'CONTRATADA')).toBe(true)
  })

  it('permite rechazar desde cualquier estado abierto', () => {
    expect(puedeTransicionar('RECIBIDA', 'RECHAZADA')).toBe(true)
    expect(puedeTransicionar('EN_REVISION', 'RECHAZADA')).toBe(true)
    expect(puedeTransicionar('ENTREVISTA', 'RECHAZADA')).toBe(true)
  })

  it('no permite retroceder', () => {
    expect(puedeTransicionar('ENTREVISTA', 'RECIBIDA')).toBe(false)
    expect(puedeTransicionar('EN_REVISION', 'RECIBIDA')).toBe(false)
  })

  it('no permite saltarse la revisión', () => {
    expect(puedeTransicionar('RECIBIDA', 'CONTRATADA')).toBe(false)
  })

  it('los estados finales no se mueven', () => {
    expect(esEstadoFinal('CONTRATADA')).toBe(true)
    expect(esEstadoFinal('RECHAZADA')).toBe(true)
    expect(esEstadoFinal('VACANTE_CUBIERTA')).toBe(true)
    expect(transicionesDesde('CONTRATADA')).toEqual([])
    expect(puedeTransicionar('RECHAZADA', 'EN_REVISION')).toBe(false)
  })

  it('un estado no cambia a sí mismo', () => {
    expect(puedeTransicionar('EN_REVISION', 'EN_REVISION')).toBe(false)
  })
})

describe('cuando la vacante se cubre', () => {
  it('cierra las postulaciones abiertas y deja intactas las que ya terminaron', () => {
    const resultado = cierrePorVacanteCubierta([
      { id: 'a', estado: 'RECIBIDA' },
      { id: 'b', estado: 'ENTREVISTA' },
      { id: 'c', estado: 'CONTRATADA' },
      { id: 'd', estado: 'RECHAZADA' },
    ])

    expect(resultado.aCerrar).toEqual(['a', 'b'])
    expect(resultado.intactas).toEqual(['c', 'd'])
  })

  it('no toca nada si no hay postulaciones abiertas', () => {
    const resultado = cierrePorVacanteCubierta([{ id: 'c', estado: 'CONTRATADA' }])
    expect(resultado.aCerrar).toEqual([])
  })
})
