import { describe, it, expect } from 'vitest'
import { PRECIOS_ASESORIA, precioAsesoria, nivelesConPrecio } from '../src/asesoria.js'

describe('precios de la asesoría de empleabilidad', () => {
  it('cobra por nivel según la tarifa acordada', () => {
    expect(precioAsesoria('ESTUDIANTE')).toBe(2500)
    expect(precioAsesoria('EXPERIMENTADO')).toBe(3500)
    expect(precioAsesoria('GERENCIA')).toBe(5000)
  })

  it('cubre los tres niveles y nada más', () => {
    expect(Object.keys(PRECIOS_ASESORIA)).toHaveLength(3)
  })

  it('expone los niveles ordenados de menor a mayor para pintar el selector', () => {
    const niveles = nivelesConPrecio()
    expect(niveles.map((n) => n.nivel)).toEqual(['ESTUDIANTE', 'EXPERIMENTADO', 'GERENCIA'])
    expect(niveles.map((n) => n.precio)).toEqual([2500, 3500, 5000])
    expect(niveles.every((n) => n.etiqueta.length > 0)).toBe(true)
  })
})
