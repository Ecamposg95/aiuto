import { describe, it, expect } from 'vitest'
import { nuevaFicha, huellaDe, vigente, identificador, correoDe, VIGENCIA_MINUTOS } from '../src/fichas.js'

const AHORA = new Date('2026-10-08T12:00:00Z')

describe('fichas de un solo uso', () => {
  it('la huella es la del valor entregado, no el valor', () => {
    const f = nuevaFicha('restablecer', AHORA)
    expect(f.huella).toBe(huellaDe(f.ficha))
    expect(f.huella).not.toContain(f.ficha)
  })

  it('cada ficha es distinta y suficientemente larga para no adivinarse', () => {
    const a = nuevaFicha('verificar', AHORA)
    const b = nuevaFicha('verificar', AHORA)
    expect(a.ficha).not.toBe(b.ficha)
    expect(a.ficha.length).toBeGreaterThanOrEqual(43) // 32 bytes en base64url
  })

  it('restablecer vence en una hora; verificar, en tres días', () => {
    expect(nuevaFicha('restablecer', AHORA).expira.toISOString()).toBe('2026-10-08T13:00:00.000Z')
    expect(VIGENCIA_MINUTOS.verificar).toBe(4320)
  })

  it('vencida en el minuto exacto, no un minuto después', () => {
    const { expira } = nuevaFicha('restablecer', AHORA)
    expect(vigente(expira, new Date('2026-10-08T12:59:59Z'))).toBe(true)
    expect(vigente(expira, new Date('2026-10-08T13:00:00Z'))).toBe(false)
  })

  it('el identificador separa propósitos y normaliza el correo', () => {
    expect(identificador('restablecer', '  Ana@X.mx ')).toBe('restablecer:ana@x.mx')
    expect(correoDe('restablecer', 'restablecer:ana@x.mx')).toBe('ana@x.mx')
  })

  it('una ficha de verificar no sirve para restablecer', () => {
    expect(correoDe('restablecer', 'verificar:ana@x.mx')).toBeNull()
  })
})
