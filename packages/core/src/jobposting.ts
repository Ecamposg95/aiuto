/**
 * Datos estructurados JobPosting, el formato con el que Google Jobs lee una
 * vacante.
 *
 * Sin esto, una bolsa de trabajo es invisible justo donde la gente busca. Y
 * AIUTO tiene una ventaja para cumplirlo: Google pide el sueldo como campo
 * recomendado y casi nadie lo manda porque casi nadie lo publica. Aquí siempre
 * está.
 *
 * Referencia: schema.org/JobPosting y las guías de Google para empleos.
 */
import type { Modalidad, Periodicidad } from './tipos.js'

/** Cómo se llama cada periodicidad en schema.org. */
const UNIDAD: Record<Periodicidad, string> = {
  POR_HORA: 'HOUR',
  SEMANAL: 'WEEK',
  QUINCENAL: 'WEEK', // schema.org no tiene quincena; se declara el monto quincenal como semanal sería mentir
  MENSUAL: 'MONTH',
  ANUAL: 'YEAR',
}

export type VacanteEstructurada = {
  puesto: string
  descripcion: string
  empresa: string
  empresaUrl?: string
  ubicacion: string
  modalidad: Modalidad
  sueldoMin: number
  sueldoMax: number
  moneda: string
  periodicidad: Periodicidad
  conocimientos: string[]
  publicadaEn: Date
  expiraEn: Date | null
}

export function jobPosting(v: VacanteEstructurada): Record<string, unknown> {
  // La quincena no existe en schema.org: se convierte a mensual para no
  // declarar una unidad que significaría otra cosa.
  const quincenal = v.periodicidad === 'QUINCENAL'
  const factor = quincenal ? 2 : 1
  const unidad = quincenal ? 'MONTH' : UNIDAD[v.periodicidad]

  const datos: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: v.puesto,
    description: v.descripcion,
    datePosted: v.publicadaEn.toISOString(),
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: v.empresa,
      ...(v.empresaUrl ? { sameAs: v.empresaUrl } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: v.ubicacion,
        addressCountry: 'MX',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: v.moneda,
      value: {
        '@type': 'QuantitativeValue',
        minValue: v.sueldoMin * factor,
        maxValue: v.sueldoMax * factor,
        unitText: unidad,
      },
    },
  }

  if (v.expiraEn) datos.validThrough = v.expiraEn.toISOString()
  if (v.conocimientos.length > 0) datos.skills = v.conocimientos.join(', ')

  // Google exige declarar el trabajo remoto de forma explícita; si no, lo trata
  // como presencial en la dirección declarada.
  if (v.modalidad === 'REMOTO') {
    datos.jobLocationType = 'TELECOMMUTE'
    datos.applicantLocationRequirements = { '@type': 'Country', name: 'México' }
  }

  return datos
}
