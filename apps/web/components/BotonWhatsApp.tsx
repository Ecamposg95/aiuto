/**
 * Botón flotante de WhatsApp (máster prompt §13).
 *
 * Va SÓLO en Inicio, Soluciones Empresariales y Empleabilidad: lo pone cada
 * página, no el layout, para que nunca aparezca por accidente en la bolsa, en
 * los paneles o en una postulación. El reclutamiento no pasa por WhatsApp.
 *
 * El número es el de Damián Medina y vive en la variable WHATSAPP_NUMERO
 * (sólo dígitos, con lada: 5215512345678). Sin ella el botón no se pinta: no
 * se inventa un número.
 */
export const MENSAJES_WHATSAPP = {
  inicio: 'Hola, me gustaría recibir orientación sobre los servicios de AIUTO',
  soluciones: 'Hola, me interesa conocer cómo AIUTO puede ayudar a mi empresa',
  empleabilidad: 'Hola, me gustaría recibir información sobre el programa de empleabilidad de AIUTO',
} as const

export function ligaWhatsApp(mensaje: string): string | null {
  const numero = (process.env.WHATSAPP_NUMERO ?? '').replace(/\D/g, '')
  if (numero.length < 10) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

export function BotonWhatsApp({ mensaje }: { mensaje: string }) {
  const liga = ligaWhatsApp(mensaje)
  if (!liga) return null
  return (
    <a
      href={liga}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z" />
      </svg>
    </a>
  )
}
