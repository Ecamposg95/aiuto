/**
 * CORS para las rutas que la landing publicada consume.
 *
 * La landing vive en `aiuto.com.mx` (Hostinger) y la aplicación en otro dominio,
 * así que el navegador trata sus peticiones como de origen cruzado. Sólo se
 * abren los orígenes de AIUTO, y sólo en las rutas que la landing necesita: el
 * panel y las acciones de servidor no se exponen.
 */

/** Los de la landing, siempre. `ORIGENES_CORS` suma otros separados por coma,
 *  para poder probar la landing local contra la aplicación desplegada. */
function origenesPermitidos(): string[] {
  const fijos = ['https://aiuto.com.mx', 'https://www.aiuto.com.mx']
  const extra = (process.env.ORIGENES_CORS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return [...fijos, ...extra]
}

/** Devuelve las cabeceras si el origen está permitido; si no, ninguna. */
export function cabecerasCors(peticion: Request): Record<string, string> {
  const origen = peticion.headers.get('origin')
  if (!origen || !origenesPermitidos().includes(origen)) return {}
  return {
    'Access-Control-Allow-Origin': origen,
    // Varía por origen: sin esto, una caché intermedia podría servirle a un
    // dominio la cabecera que se calculó para otro.
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

/** Respuesta al preflight del navegador. */
export function responderPreflight(peticion: Request): Response {
  return new Response(null, { status: 204, headers: cabecerasCors(peticion) })
}
