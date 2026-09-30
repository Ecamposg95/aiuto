import { describe, it, expect } from 'vitest'
import { jobPosting, type VacanteEstructurada } from '../src/jobposting.js'

const base: VacanteEstructurada = {
  puesto: 'Ingeniera de plataforma',
  descripcion: 'Mantener la infraestructura del producto.',
  empresa: 'Nube Verde',
  ubicacion: 'Ciudad de México',
  modalidad: 'HIBRIDO',
  sueldoMin: 70000,
  sueldoMax: 95000,
  moneda: 'MXN',
  periodicidad: 'MENSUAL',
  conocimientos: ['Kubernetes', 'Go'],
  publicadaEn: new Date('2026-09-01T12:00:00Z'),
  expiraEn: new Date('2026-10-31T12:00:00Z'),
}

const con = (cambios: Partial<VacanteEstructurada> = {}) => jobPosting({ ...base, ...cambios })

describe('jobPosting', () => {
  it('trae los campos que Google exige', () => {
    const j = con()
    for (const campo of ['@context', '@type', 'title', 'description', 'datePosted', 'hiringOrganization', 'jobLocation']) {
      expect(j[campo], `falta ${campo}`).toBeDefined()
    }
    expect(j['@type']).toBe('JobPosting')
  })

  it('siempre declara el sueldo, que es la ventaja de AIUTO', () => {
    const j = con() as { baseSalary: { value: Record<string, unknown>; currency: string } }
    expect(j.baseSalary.currency).toBe('MXN')
    expect(j.baseSalary.value.minValue).toBe(70000)
    expect(j.baseSalary.value.maxValue).toBe(95000)
    expect(j.baseSalary.value.unitText).toBe('MONTH')
  })

  it('convierte la quincena a mensual: schema.org no tiene quincenas', () => {
    const j = con({ periodicidad: 'QUINCENAL', sueldoMin: 15000, sueldoMax: 15000 }) as {
      baseSalary: { value: Record<string, unknown> }
    }
    expect(j.baseSalary.value.unitText).toBe('MONTH')
    expect(j.baseSalary.value.minValue).toBe(30000)
  })

  it('traduce el resto de las periodicidades', () => {
    const unidad = (p: VacanteEstructurada['periodicidad']) =>
      (con({ periodicidad: p }) as { baseSalary: { value: { unitText: string } } }).baseSalary.value.unitText
    expect(unidad('POR_HORA')).toBe('HOUR')
    expect(unidad('SEMANAL')).toBe('WEEK')
    expect(unidad('ANUAL')).toBe('YEAR')
  })

  it('declara el remoto explícitamente o Google lo trata como presencial', () => {
    const j = con({ modalidad: 'REMOTO' })
    expect(j.jobLocationType).toBe('TELECOMMUTE')
    expect(j.applicantLocationRequirements).toBeDefined()
  })

  it('no marca como remoto lo que no lo es', () => {
    expect(con({ modalidad: 'PRESENCIAL' }).jobLocationType).toBeUndefined()
    expect(con({ modalidad: 'HIBRIDO' }).jobLocationType).toBeUndefined()
  })

  it('incluye la vigencia, para que Google la retire al vencer', () => {
    expect(con().validThrough).toBe('2026-10-31T12:00:00.000Z')
    expect(con({ expiraEn: null }).validThrough).toBeUndefined()
  })

  it('es serializable sin perder nada', () => {
    const j = con()
    expect(() => JSON.parse(JSON.stringify(j))).not.toThrow()
    expect(JSON.stringify(j)).not.toContain('undefined')
  })
})
