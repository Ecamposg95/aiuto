import type { Vacante, Company } from '@aiuto/db'

/** Lo que ya tiene una vacante, en la forma que espera FormaVacante. */
export function valoresDeVacante(vacante: Vacante & { company: Company }): Record<string, string> {
  return {
    empresa: vacante.company.nombre,
    categoryId: vacante.categoryId,
    puesto: vacante.puesto,
    ubicacion: vacante.ubicacion,
    modalidad: vacante.modalidad,
    descripcion: vacante.descripcion,
    resultadosEsperados: vacante.resultadosEsperados ?? '',
    requisitos: vacante.requisitos.join('\n'),
    instrucciones: vacante.instrucciones ?? '',
    sueldoMin: String(vacante.sueldoMin),
    sueldoMax: String(vacante.sueldoMax),
    sueldoNeto: vacante.sueldoNeto ? 'si' : '',
    periodicidad: vacante.periodicidad,
    seguroSocial: vacante.seguroSocial,
    seguroSocialPct: String(vacante.seguroSocialPct),
    prestaciones: vacante.prestaciones,
    horario: vacante.horario,
    conocimientos: vacante.conocimientos.join(', '),
    numEntrevistas: String(vacante.numEntrevistas),
    diasCierreEsperado: String(vacante.diasCierreEsperado),
  }
}
