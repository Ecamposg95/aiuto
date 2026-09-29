/**
 * Reglas de la vacante.
 *
 * Estas validaciones son el producto: una bolsa que obliga a declarar sueldo,
 * seguro social, prestaciones, horario, número de entrevistas y plazo de cierre.
 * La base de datos ya impide que falten (las columnas son NOT NULL); aquí se
 * impide que vengan mal.
 */
import type { Falla, Modalidad, Periodicidad, Resultado, SeguroSocial } from './tipos.js'

/** Ninguna vacante vive más de dos meses. */
export const DIAS_VIGENCIA_VACANTE = 60

/** Tope de entrevistas que se considera un proceso razonable, no una odisea. */
export const MAX_ENTREVISTAS = 10

export type DatosVacante = {
  puesto: string
  descripcion: string
  ubicacion: string
  modalidad: Modalidad
  sueldoMin: number
  sueldoMax: number
  periodicidad: Periodicidad
  seguroSocial: SeguroSocial
  seguroSocialPct: number
  prestaciones: string
  horario: string
  conocimientos: string[]
  numEntrevistas: number
  diasCierreEsperado: number
}

const vacio = (s: string) => s.trim().length === 0
const entero = (n: number) => Number.isInteger(n)

export function validarVacante(datos: DatosVacante): Resultado<DatosVacante> {
  const fallas: Falla[] = []
  const falla = (campo: string, mensaje: string) => fallas.push({ campo, mensaje })

  if (vacio(datos.puesto)) falla('puesto', 'El puesto es obligatorio.')
  if (vacio(datos.descripcion)) falla('descripcion', 'La descripción es obligatoria.')
  if (vacio(datos.ubicacion)) falla('ubicacion', 'La ubicación es obligatoria.')

  // Sueldo. Es el campo que distingue a AIUTO del resto: sin él no se publica.
  if (!entero(datos.sueldoMin) || datos.sueldoMin <= 0) {
    falla('sueldoMin', 'El sueldo mínimo debe ser mayor que cero.')
  }
  if (!entero(datos.sueldoMax) || datos.sueldoMax <= 0) {
    falla('sueldoMax', 'El sueldo máximo debe ser mayor que cero.')
  } else if (datos.sueldoMax < datos.sueldoMin) {
    falla('sueldoMax', 'El sueldo máximo no puede ser menor que el mínimo.')
  }

  // Seguro social. COMPLETO significa exactamente 100%; cualquier otra cosa es MIXTO.
  if (!entero(datos.seguroSocialPct)) {
    falla('seguroSocialPct', 'El porcentaje de seguro social debe ser un número entero.')
  } else if (datos.seguroSocial === 'COMPLETO' && datos.seguroSocialPct !== 100) {
    falla('seguroSocialPct', 'Un seguro social completo se declara al 100 %.')
  } else if (
    datos.seguroSocial === 'MIXTO' &&
    (datos.seguroSocialPct < 1 || datos.seguroSocialPct >= 100)
  ) {
    falla('seguroSocialPct', 'Un seguro social mixto va entre 1 y 99 %; al 100 % es completo.')
  }

  if (vacio(datos.prestaciones)) falla('prestaciones', 'Hay que declarar las prestaciones.')
  if (vacio(datos.horario)) falla('horario', 'Hay que declarar el horario.')

  if (datos.conocimientos.filter((c) => !vacio(c)).length === 0) {
    falla('conocimientos', 'Hay que indicar al menos un conocimiento requerido.')
  }

  if (!entero(datos.numEntrevistas) || datos.numEntrevistas < 1) {
    falla('numEntrevistas', 'El proceso tiene al menos una entrevista.')
  } else if (datos.numEntrevistas > MAX_ENTREVISTAS) {
    falla('numEntrevistas', `Un proceso de más de ${MAX_ENTREVISTAS} entrevistas no es razonable.`)
  }

  if (!entero(datos.diasCierreEsperado) || datos.diasCierreEsperado < 1) {
    falla('diasCierreEsperado', 'Hay que estimar en cuántos días se cierra la vacante.')
  } else if (datos.diasCierreEsperado > DIAS_VIGENCIA_VACANTE) {
    falla(
      'diasCierreEsperado',
      `El plazo no puede exceder los ${DIAS_VIGENCIA_VACANTE} días de vigencia de la vacante.`,
    )
  }

  return fallas.length === 0 ? { ok: true, valor: datos } : { ok: false, fallas }
}

/** Toda vacante nace con fecha de muerte. */
export function calcularExpiracion(publicadaEn: Date): Date {
  const expira = new Date(publicadaEn.getTime())
  expira.setUTCDate(expira.getUTCDate() + DIAS_VIGENCIA_VACANTE)
  return expira
}

/**
 * El reloj se recibe como argumento para poder probar el cierre automático sin
 * esperar sesenta días.
 */
export function estaVencida(vacante: { expiraEn: Date | null }, ahora: Date): boolean {
  if (vacante.expiraEn === null) return false
  return ahora.getTime() >= vacante.expiraEn.getTime()
}
