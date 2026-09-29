import { describe, it, expect } from 'vitest'
import { generarSlug } from '../src/slug.js'

describe('generarSlug', () => {
  it('baja a minúsculas y une con guiones', () => {
    expect(generarSlug('Desarrollador Backend')).toBe('desarrollador-backend')
  })

  it('quita acentos y eñes, que en una URL estorban', () => {
    expect(generarSlug('Diseñador Gráfico Señor')).toBe('disenador-grafico-senor')
  })

  it('descarta signos y colapsa separadores', () => {
    expect(generarSlug('Gerente de  Ventas & Marketing (CDMX)')).toBe(
      'gerente-de-ventas-marketing-cdmx',
    )
  })

  it('no deja guiones colgando en los extremos', () => {
    expect(generarSlug('  ¡Urgente!  ')).toBe('urgente')
  })

  it('combina varias partes', () => {
    expect(generarSlug('Contador', 'Grupo Serena')).toBe('contador-grupo-serena')
  })

  it('recorta para que la URL no se vuelva absurda', () => {
    expect(generarSlug('a'.repeat(200)).length).toBeLessThanOrEqual(80)
  })

  it('no termina en guión al recortar', () => {
    const s = generarSlug('palabra '.repeat(40))
    expect(s.endsWith('-')).toBe(false)
  })

  it('devuelve cadena vacía si no queda nada utilizable', () => {
    expect(generarSlug('!!! ¿?')).toBe('')
  })
})
