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

export const esquemaRegistro = z.object({
  nombre,
  correo,
  // Ocho es el mínimo que sirve de algo; pedir símbolos y mayúsculas produce
  // contraseñas peores, no mejores, porque la gente las apunta en un papel.
  password: z.string().min(8, 'La contraseña necesita al menos 8 caracteres.').max(200),
  sitioWeb: z.string().optional(),
})

export const esquemaPerfil = z.object({
  titular: z.string().trim().max(120).optional().or(z.literal('')),
  resumen: z.string().trim().max(1500).optional().or(z.literal('')),
  nivel: z.enum(['ESTUDIANTE', 'EXPERIMENTADO', 'GERENCIA']),
  anosExperiencia: z.coerce.number().int().min(0).max(60),
  telefono,
  // Código postal, no domicilio: alcanza para calcular distancia a una vacante
  // sin custodiar dónde vive la gente.
  codigoPostal: z.string().trim().regex(/^\d{5}$|^$/, 'El código postal son 5 dígitos.').optional().or(z.literal('')),
  habilidades: z.string().trim().max(500).optional().or(z.literal('')),
  ligaPortafolio: z.string().trim().url('Esa liga no se ve bien.').max(300).optional().or(z.literal('')),
  ligaVideo: z.string().trim().url('Esa liga no se ve bien.').max(300).optional().or(z.literal('')),
  disponibilidad: z.string().trim().max(200).optional().or(z.literal('')),
})

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

export type DatosRegistro = z.infer<typeof esquemaRegistro>
export type DatosPerfil = z.infer<typeof esquemaPerfil>
export type DatosPostulacion = z.infer<typeof esquemaPostulacion>
export type DatosAsesoria = z.infer<typeof esquemaAsesoria>
export type DatosSolicitud = z.infer<typeof esquemaSolicitud>
