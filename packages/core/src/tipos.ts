/**
 * Tipos del dominio. Espejo de las enumeraciones de Prisma, declarados aquí para
 * que `@aiuto/core` no dependa de la base de datos ni de ningún framework: es lo
 * que permite extraer una API después moviendo archivos en vez de reescribir.
 */

export type NivelCandidato = 'ESTUDIANTE' | 'EXPERIMENTADO' | 'GERENCIA'

export type Modalidad = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO'

export type SeguroSocial = 'COMPLETO' | 'MIXTO'

export type Periodicidad = 'POR_HORA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'ANUAL'

export type EstadoVacante = 'BORRADOR' | 'ABIERTA' | 'CUBIERTA' | 'CERRADA' | 'EXPIRADA'

export type EstadoPostulacion =
  | 'RECIBIDA'
  | 'EN_REVISION'
  | 'ENTREVISTA'
  | 'CONTRATADA'
  | 'RECHAZADA'
  | 'VACANTE_CUBIERTA'

/** Falla de validación, con el campo señalado para poder pintarlo en el formulario. */
export type Falla = { campo: string; mensaje: string }

export type Resultado<T> = { ok: true; valor: T } | { ok: false; fallas: Falla[] }
