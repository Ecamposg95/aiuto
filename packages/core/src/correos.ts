/**
 * El contenido de los correos.
 *
 * Vive en `core` y no en la aplicación web por el mismo motivo que el formateo
 * de sueldo: es producto, no presentación. Aquí se decide qué se le dice a una
 * persona cuando su postulación cambia de estado, y eso es justo lo que AIUTO
 * promete que las demás bolsas no hacen.
 *
 * Cada correo trae texto plano y HTML. El texto plano no es un accesorio: hay
 * clientes que no pintan HTML, filtros que castigan a quien no lo manda, y
 * lectores de pantalla a los que les sirve más.
 */
import { formatearSueldo } from './formato.js'
import type { EstadoPostulacion, NivelCandidato, Periodicidad } from './tipos.js'

export type Correo = { asunto: string; texto: string; html: string }

export type VacanteEnCorreo = {
  puesto: string
  empresa: string
  sueldoMin: number
  sueldoMax: number
  moneda: string
  periodicidad: Periodicidad
}

const FIRMA = 'El equipo de AIUTO'

/** Estados que ameritan escribirle al candidato. RECIBIDA no: para eso va el acuse. */
export const ESTADOS_QUE_AVISAN: readonly EstadoPostulacion[] = [
  'EN_REVISION',
  'ENTREVISTA',
  'CONTRATADA',
  'RECHAZADA',
  'VACANTE_CUBIERTA',
]

// ---------------------------------------------------------------- armado

const escapar = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Arma las dos versiones a partir de los mismos párrafos, para que no se
 * desincronicen: un correo cuyo HTML dice algo distinto que su texto plano es
 * un correo que alguien va a leer mal.
 */
function armar(opciones: {
  asunto: string
  saludo: string
  parrafos: string[]
  liga?: { texto: string; url: string }
  cierre?: string
}): Correo {
  const { asunto, saludo, parrafos, liga, cierre } = opciones

  const texto = [
    `${saludo},`,
    '',
    ...parrafos.flatMap((p) => [p, '']),
    ...(liga ? [`${liga.texto}:`, liga.url, ''] : []),
    ...(cierre ? [cierre, ''] : []),
    FIRMA,
  ].join('\n')

  const html = [
    '<!doctype html><html lang="es-MX"><body style="margin:0;background:#f8f7f7">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f7">',
    '<tr><td align="center" style="padding:32px 16px">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"',
    ' style="max-width:560px;background:#ffffff;border-top:2px solid #201e1d">',
    '<tr><td style="padding:32px 24px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#201e1d">',
    `<p style="margin:0 0 16px;font-size:11.5px;letter-spacing:.14em;font-weight:600;color:#6b6866">AIUTO</p>`,
    `<p style="margin:0 0 16px">${escapar(saludo)},</p>`,
    ...parrafos.map((p) => `<p style="margin:0 0 16px">${escapar(p)}</p>`),
    ...(liga
      ? [
          `<p style="margin:24px 0"><a href="${escapar(liga.url)}"`,
          ' style="display:inline-block;background:#572967;color:#ffffff;text-decoration:none;',
          `padding:12px 20px;font-weight:600">${escapar(liga.texto)}</a></p>`,
          `<p style="margin:0 0 16px;font-size:12px;color:#6b6866">Si el botón no funciona, copia esta liga:<br>${escapar(liga.url)}</p>`,
        ]
      : []),
    ...(cierre ? [`<p style="margin:0 0 16px">${escapar(cierre)}</p>`] : []),
    `<p style="margin:24px 0 0;color:#57534f">${FIRMA}</p>`,
    '</td></tr></table></td></tr></table></body></html>',
  ].join('')

  return { asunto, texto, html }
}

const sueldoDe = (v: VacanteEnCorreo) => formatearSueldo(v)

// ---------------------------------------------------------------- candidato

export function correoAcusePostulacion(datos: {
  nombre: string
  vacante: VacanteEnCorreo
  liga: string
}): Correo {
  const { nombre, vacante, liga } = datos
  return armar({
    asunto: `Recibimos tu postulación · ${vacante.puesto}`,
    saludo: `Hola, ${nombre}`,
    parrafos: [
      `Quedó registrada tu postulación a ${vacante.puesto}, en ${vacante.empresa}.`,
      `El sueldo publicado es de ${sueldoDe(vacante)}, y eso es lo que la empresa se comprometió a pagar al publicarla.`,
      'Te vamos a avisar cada vez que tu postulación cambie de estado. No tienes que preguntar ni esperar a ciegas.',
    ],
    liga: { texto: 'Ver el estado de mi postulación', url: liga },
    cierre: 'Guarda esta liga: con ella puedes consultar tu postulación cuando quieras.',
  })
}

const POR_ESTADO: Partial<
  Record<EstadoPostulacion, (nombre: string, v: VacanteEnCorreo) => { asunto: string; parrafos: string[]; cierre?: string }>
> = {
  EN_REVISION: (_n, v) => ({
    asunto: `Estamos revisando tu perfil · ${v.puesto}`,
    parrafos: [
      `Alguien del equipo ya tiene tu perfil en las manos para la vacante de ${v.puesto}, en ${v.empresa}.`,
      'Te escribimos de nuevo en cuanto haya una decisión.',
    ],
  }),
  ENTREVISTA: (_n, v) => ({
    asunto: `Pasaste a entrevista · ${v.puesto}`,
    parrafos: [
      `Avanzaste en el proceso de ${v.puesto}, en ${v.empresa}.`,
      'Nos vamos a poner en contacto contigo para agendar la entrevista.',
    ],
  }),
  CONTRATADA: (_n, v) => ({
    asunto: `Te contrataron · ${v.puesto}`,
    parrafos: [
      `Felicidades: quedaste en la vacante de ${v.puesto}, en ${v.empresa}.`,
      'Gracias por confiarnos tu búsqueda.',
    ],
  }),
  RECHAZADA: (_n, v) => ({
    asunto: `Sobre tu postulación · ${v.puesto}`,
    parrafos: [
      `No seguimos adelante con tu postulación a ${v.puesto}, en ${v.empresa}.`,
      'Preferimos decírtelo a dejarte esperando. No es un juicio sobre ti: para esta vacante en particular no avanzamos.',
    ],
    cierre: 'Si aparece algo que empate mejor contigo, te avisamos.',
  }),
  VACANTE_CUBIERTA: (_n, v) => ({
    asunto: `La vacante se cubrió · ${v.puesto}`,
    parrafos: [
      `La vacante de ${v.puesto}, en ${v.empresa}, ya se cubrió y se dio de baja.`,
      'Gracias por el tiempo que le dedicaste a postularte.',
    ],
  }),
}

/** Devuelve null cuando el estado no amerita escribirle a nadie. */
export function correoCambioEstado(datos: {
  nombre: string
  estado: EstadoPostulacion
  vacante: VacanteEnCorreo
  liga: string
}): Correo | null {
  const armador = POR_ESTADO[datos.estado]
  if (!armador) return null

  const { asunto, parrafos, cierre } = armador(datos.nombre, datos.vacante)
  return armar({
    asunto,
    saludo: `Hola, ${datos.nombre}`,
    parrafos,
    liga: { texto: 'Ver mi postulación', url: datos.liga },
    cierre,
  })
}

// ---------------------------------------------------------------- acuses

export function correoAcuseSolicitud(datos: { nombre: string }): Correo {
  return armar({
    asunto: 'Recibimos tu mensaje · AIUTO',
    saludo: `Hola, ${datos.nombre}`,
    parrafos: [
      'Recibimos tu mensaje y ya está asignado a alguien del equipo.',
      // A propósito sin prometer plazos: una promesa de "24 horas" que no se
      // cumple hace más daño que no haber dicho nada.
      'Te contestamos en cuanto lo hayamos revisado.',
    ],
  })
}

const NIVELES: Record<NivelCandidato, string> = {
  ESTUDIANTE: 'estudiante o recién egresado',
  EXPERIMENTADO: 'persona con experiencia',
  GERENCIA: 'gerencia o dirección',
}

export function correoAcuseAsesoria(datos: {
  nombre: string
  nivel: NivelCandidato
  precio: number
  moneda: string
}): Correo {
  const precio = `$${datos.precio.toLocaleString('es-MX')} ${datos.moneda}`
  return armar({
    asunto: 'Recibimos tu solicitud de asesoría · AIUTO',
    saludo: `Hola, ${datos.nombre}`,
    parrafos: [
      `Recibimos tu solicitud de asesoría de empleabilidad, en la modalidad de ${NIVELES[datos.nivel]}, con un costo de ${precio}.`,
      'La dirección de AIUTO se pone en contacto contigo para acordar cómo empezamos.',
      'No se te ha cobrado nada: el pago se acuerda directamente con nosotros.',
    ],
  })
}

// ---------------------------------------------------------------- equipo

export function correoAvisoEquipo(datos: {
  titulo: string
  detalle: string
  campos: readonly (readonly [string, string])[]
  liga: string
}): Correo {
  const { titulo, detalle, campos, liga } = datos
  return armar({
    asunto: `${titulo} · ${detalle}`,
    saludo: 'Equipo',
    parrafos: [
      `${titulo}: ${detalle}.`,
      ...campos.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`),
    ],
    liga: { texto: 'Abrir en el panel', url: liga },
  })
}
