import type { Correo } from '@aiuto/core'

/**
 * Envío de correo.
 *
 * El proveedor está detrás de esta interfaz a propósito: hoy no hay uno
 * decidido (pendiente 4 de la spec), y mientras tanto los correos se escriben
 * en la bitácora del servidor. Cuando exista la llave, sólo se configura
 * `EMAIL_API_KEY` y el mismo código empieza a mandar de verdad.
 *
 * Regla dura: **enviar nunca revienta el flujo**. Si el proveedor está caído,
 * la postulación se guarda igual. Perder un correo es malo; perder la
 * postulación de alguien porque el correo falló es inaceptable.
 */

export type Destinatario = { correo: string; nombre?: string }

type Resultado = { enviado: boolean; via: 'resend' | 'bitacora'; error?: string }

const remitente = () => process.env.EMAIL_FROM ?? 'no-reply@aiuto.com.mx'

function destino(d: Destinatario): string {
  return d.nombre ? `${d.nombre} <${d.correo}>` : d.correo
}

/** Sin proveedor configurado: queda constancia en la bitácora del servidor. */
function aBitacora(correo: Correo, a: Destinatario[]): Resultado {
  console.log(
    [
      '--- CORREO (sin proveedor configurado) ---',
      `para:    ${a.map((d) => d.correo).join(', ')}`,
      `de:      ${remitente()}`,
      `asunto:  ${correo.asunto}`,
      '',
      correo.texto,
      '--- fin del correo ---',
    ].join('\n'),
  )
  return { enviado: false, via: 'bitacora' }
}

async function porResend(correo: Correo, a: Destinatario[], llave: string): Promise<Resultado> {
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${llave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: remitente(),
      to: a.map(destino),
      subject: correo.asunto,
      text: correo.texto,
      html: correo.html,
    }),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '')
    return { enviado: false, via: 'resend', error: `${respuesta.status} ${detalle.slice(0, 200)}` }
  }
  return { enviado: true, via: 'resend' }
}

export async function enviarCorreo(
  correo: Correo,
  a: Destinatario | Destinatario[],
): Promise<Resultado> {
  const destinatarios = (Array.isArray(a) ? a : [a]).filter((d) => d.correo)
  if (destinatarios.length === 0) return { enviado: false, via: 'bitacora', error: 'sin destinatario' }

  const llave = process.env.EMAIL_API_KEY
  if (!llave) return aBitacora(correo, destinatarios)

  try {
    const r = await porResend(correo, destinatarios, llave)
    if (!r.enviado) console.error('No se pudo enviar el correo:', correo.asunto, r.error)
    return r
  } catch (error) {
    console.error('No se pudo enviar el correo:', correo.asunto, error)
    return { enviado: false, via: 'resend', error: String(error) }
  }
}

/**
 * Manda varios y no se detiene si uno falla. Se usa al cerrar una vacante, donde
 * un correo rebotado no debe impedir que los demás se enteren.
 */
export async function enviarCorreos(
  envios: readonly { correo: Correo; a: Destinatario }[],
): Promise<{ enviados: number; fallidos: number }> {
  const resultados = await Promise.allSettled(envios.map((e) => enviarCorreo(e.correo, e.a)))
  let enviados = 0
  let fallidos = 0
  for (const r of resultados) {
    if (r.status === 'fulfilled' && r.value.enviado) enviados++
    else fallidos++
  }
  return { enviados, fallidos }
}

/** A dónde llegan los avisos internos. */
export function correoDelEquipo(): Destinatario | null {
  const correo = process.env.EQUIPO_EMAIL
  return correo ? { correo } : null
}

/** La base pública, para armar las ligas que van dentro de los correos. */
export function basePublica(): string {
  return (
    process.env.APP_URL ??
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ??
    process.env.AUTH_URL ??
    'http://localhost:3000'
  )
}
