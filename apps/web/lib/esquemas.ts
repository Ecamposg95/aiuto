import { z } from 'zod'

/**
 * Validación de lo que entra por HTTP.
 *
 * La spec las ubicaba en `packages/shared`; mientras haya un solo consumidor,
 * un paquete aparte sería ceremonia. Se mueven el día que exista el segundo.
 */

const correo = z
  .string()
  .trim()
  .min(1, 'Hace falta tu correo.')
  .email('Ese correo no se ve bien.')
  .max(200)
  .toLowerCase()

const nombre = z.string().trim().min(2, 'Hace falta tu nombre.').max(120)

const telefono = z
  .string()
  .trim()
  .max(30)
  .regex(/^[\d\s()+-]*$/, 'El teléfono sólo lleva números.')
  .optional()
  .or(z.literal(''))

export const esquemaPostulacion = z.object({
  vacanteSlug: z.string().trim().min(1).max(200),
  nombre,
  correo,
  telefono,
  mensaje: z.string().trim().max(2000).optional().or(z.literal('')),
  // Trampa para robots: campo oculto que una persona nunca llena. Se acepta
  // cualquier valor a propósito — rechazarlo aquí devolvería un 422 que le
  // dice al robot qué lo delató. Quien lo llena recibe un 201 y nada se guarda.
  sitioWeb: z.string().optional(),
})

export const esquemaAsesoria = z.object({
  nombre,
  correo,
  telefono,
  nivel: z.enum(['ESTUDIANTE', 'EXPERIMENTADO', 'GERENCIA']),
  mensaje: z.string().trim().max(2000).optional().or(z.literal('')),
  sitioWeb: z.string().optional(),
})

export const esquemaSolicitud = z.object({
  tipo: z.enum(['CONTACTO', 'CATEGORIA', 'EMPRESA']),
  categoriaSlug: z.string().trim().max(60).optional().or(z.literal('')),
  nombre,
  correo,
  telefono,
  empresa: z.string().trim().max(160).optional().or(z.literal('')),
  mensaje: z.string().trim().min(1, 'Cuéntanos qué necesitas.').max(2000),
  origen: z.string().trim().max(120),
  sitioWeb: z.string().optional(),
})

export type DatosPostulacion = z.infer<typeof esquemaPostulacion>
export type DatosAsesoria = z.infer<typeof esquemaAsesoria>
export type DatosSolicitud = z.infer<typeof esquemaSolicitud>
