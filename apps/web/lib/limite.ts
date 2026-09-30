/**
 * Límite de peticiones para las rutas públicas que escriben.
 *
 * El honeypot atrapa robots tontos; esto atrapa al que insiste. Sin límite,
 * cualquiera puede llenar la bandeja del equipo con miles de solicitudes y
 * dejarla inservible justo cuando llegue una real.
 *
 * Vive en memoria del proceso a propósito: con una sola instancia alcanza, y
 * meter Redis para esto sería pagar una pieza de infraestructura antes de
 * necesitarla. El día que haya varias instancias, este archivo es lo único que
 * cambia — pero conviene saberlo: con N instancias el límite efectivo es N
 * veces el configurado.
 */

type Ventana = { conteo: number; expira: number }

const registros = new Map<string, Ventana>()

/** Se limpia de vez en cuando para que el mapa no crezca sin fin. */
let ultimaLimpieza = Date.now()
const CADA = 5 * 60 * 1000

function limpiar(ahora: number) {
  if (ahora - ultimaLimpieza < CADA) return
  ultimaLimpieza = ahora
  for (const [clave, v] of registros) if (v.expira <= ahora) registros.delete(clave)
}

export type ResultadoLimite = { permitido: boolean; restantes: number; esperaSegundos: number }

/**
 * Salida para el arnés de pruebas.
 *
 * Las suites recorren los mismos endpoints una y otra vez desde una sola IP, y
 * sin esto chocarían contra el tope y dejarían de probar lo que van a probar.
 * Exige el mismo secreto que la tarea programada: quien lo tiene ya podía
 * cerrar vacantes, asi que no abre nada nuevo.
 */
function traeElPase(peticion: Request): boolean {
  const secreto = process.env.TAREAS_SECRET
  if (!secreto) return false
  return peticion.headers.get('x-aiuto-pase') === secreto
}

export function dentroDelLimite(
  clave: string,
  opciones: { maximo: number; ventanaSegundos: number },
  peticion?: Request,
): ResultadoLimite {
  if (peticion && traeElPase(peticion)) {
    return { permitido: true, restantes: opciones.maximo, esperaSegundos: 0 }
  }

  const ahora = Date.now()
  limpiar(ahora)

  const actual = registros.get(clave)
  if (!actual || actual.expira <= ahora) {
    registros.set(clave, { conteo: 1, expira: ahora + opciones.ventanaSegundos * 1000 })
    return { permitido: true, restantes: opciones.maximo - 1, esperaSegundos: 0 }
  }

  actual.conteo++
  const permitido = actual.conteo <= opciones.maximo
  return {
    permitido,
    restantes: Math.max(0, opciones.maximo - actual.conteo),
    esperaSegundos: permitido ? 0 : Math.ceil((actual.expira - ahora) / 1000),
  }
}

/**
 * De dónde viene la petición. Railway pone la IP real en `x-forwarded-for`.
 *
 * Es falsificable, así que esto NO es una defensa de seguridad: es una barrera
 * contra el abuso accidental y el robot perezoso. Lo que sí protege de verdad
 * son las restricciones de la base y la validación.
 */
export function origenDe(peticion: Request): string {
  const reenviada = peticion.headers.get('x-forwarded-for')
  return reenviada?.split(',')[0]?.trim() || peticion.headers.get('x-real-ip') || 'desconocido'
}

/** Respuesta estándar cuando alguien se pasa. */
export function demasiadasPeticiones(espera: number, cabeceras: Record<string, string> = {}) {
  return Response.json(
    { error: 'Demasiados envíos seguidos. Espera un momento e inténtalo otra vez.' },
    { status: 429, headers: { ...cabeceras, 'Retry-After': String(espera) } },
  )
}
