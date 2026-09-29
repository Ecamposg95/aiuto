import { describe, it, expect } from 'vitest'
import {
  DIAS_VIGENCIA_VACANTE,
  calcularExpiracion,
  estaVencida,
  validarVacante,
  type DatosVacante,
} from '../src/vacante.js'

/** Una vacante válida mínima; cada prueba rompe un solo campo. */
function vacanteValida(cambios: Partial<DatosVacante> = {}): DatosVacante {
  return {
    puesto: 'Desarrollador backend',
    descripcion: 'Construir y mantener servicios en Node.',
    ubicacion: 'Guadalajara, Jalisco',
    modalidad: 'HIBRIDO',
    sueldoMin: 35000,
    sueldoMax: 45000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, seguro de gastos médicos mayores.',
    horario: 'Lunes a viernes, 9:00 a 18:00',
    conocimientos: ['Node.js', 'PostgreSQL'],
    numEntrevistas: 2,
    diasCierreEsperado: 30,
    ...cambios,
  }
}

describe('validarVacante', () => {
  it('acepta una vacante completa', () => {
    const r = validarVacante(vacanteValida())
    expect(r.ok).toBe(true)
  })

  describe('el sueldo es innegociable', () => {
    it('rechaza sueldo mínimo en cero', () => {
      const r = validarVacante(vacanteValida({ sueldoMin: 0, sueldoMax: 0 }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.fallas.map((f) => f.campo)).toContain('sueldoMin')
    })

    it('rechaza sueldo negativo', () => {
      const r = validarVacante(vacanteValida({ sueldoMin: -1 }))
      expect(r.ok).toBe(false)
    })

    it('rechaza un máximo menor que el mínimo', () => {
      const r = validarVacante(vacanteValida({ sueldoMin: 50000, sueldoMax: 40000 }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.fallas.map((f) => f.campo)).toContain('sueldoMax')
    })

    it('acepta un sueldo fijo, sin rango', () => {
      const r = validarVacante(vacanteValida({ sueldoMin: 40000, sueldoMax: 40000 }))
      expect(r.ok).toBe(true)
    })
  })

  describe('seguro social', () => {
    it('exige 100 por ciento cuando se declara COMPLETO', () => {
      const r = validarVacante(vacanteValida({ seguroSocial: 'COMPLETO', seguroSocialPct: 60 }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.fallas.map((f) => f.campo)).toContain('seguroSocialPct')
    })

    it('acepta un porcentaje parcial cuando es MIXTO', () => {
      const r = validarVacante(vacanteValida({ seguroSocial: 'MIXTO', seguroSocialPct: 60 }))
      expect(r.ok).toBe(true)
    })

    it('rechaza MIXTO al 100 por ciento: eso es COMPLETO', () => {
      const r = validarVacante(vacanteValida({ seguroSocial: 'MIXTO', seguroSocialPct: 100 }))
      expect(r.ok).toBe(false)
    })

    it('rechaza porcentajes fuera de rango', () => {
      expect(validarVacante(vacanteValida({ seguroSocial: 'MIXTO', seguroSocialPct: 0 })).ok).toBe(false)
      expect(validarVacante(vacanteValida({ seguroSocial: 'MIXTO', seguroSocialPct: 101 })).ok).toBe(false)
    })
  })

  describe('el resto de la transparencia', () => {
    it('exige al menos una entrevista', () => {
      const r = validarVacante(vacanteValida({ numEntrevistas: 0 }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.fallas.map((f) => f.campo)).toContain('numEntrevistas')
    })

    it('rechaza un proceso de más de diez entrevistas', () => {
      expect(validarVacante(vacanteValida({ numEntrevistas: 11 })).ok).toBe(false)
    })

    it('exige un plazo de cierre dentro de la vigencia de la vacante', () => {
      expect(validarVacante(vacanteValida({ diasCierreEsperado: 0 })).ok).toBe(false)
      expect(
        validarVacante(vacanteValida({ diasCierreEsperado: DIAS_VIGENCIA_VACANTE + 1 })).ok,
      ).toBe(false)
    })

    it('exige prestaciones y horario declarados', () => {
      expect(validarVacante(vacanteValida({ prestaciones: '   ' })).ok).toBe(false)
      expect(validarVacante(vacanteValida({ horario: '' })).ok).toBe(false)
    })

    it('exige al menos un conocimiento', () => {
      const r = validarVacante(vacanteValida({ conocimientos: [] }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.fallas.map((f) => f.campo)).toContain('conocimientos')
    })
  })

  it('reporta todas las fallas juntas, no la primera', () => {
    const r = validarVacante(vacanteValida({ sueldoMin: 0, sueldoMax: 0, numEntrevistas: 0, horario: '' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.fallas.length).toBeGreaterThanOrEqual(3)
  })
})

describe('vigencia', () => {
  it('expira a los 60 días de publicada', () => {
    const publicada = new Date('2026-01-01T12:00:00Z')
    const expira = calcularExpiracion(publicada)
    expect(expira.toISOString()).toBe('2026-03-02T12:00:00.000Z')
  })

  it('no está vencida el día anterior al corte', () => {
    const expira = new Date('2026-03-02T12:00:00Z')
    expect(estaVencida({ expiraEn: expira }, new Date('2026-03-01T12:00:00Z'))).toBe(false)
  })

  it('está vencida al llegar el corte', () => {
    const expira = new Date('2026-03-02T12:00:00Z')
    expect(estaVencida({ expiraEn: expira }, new Date('2026-03-02T12:00:00Z'))).toBe(true)
  })

  it('una vacante sin fecha de expiración no vence', () => {
    expect(estaVencida({ expiraEn: null }, new Date())).toBe(false)
  })
})
