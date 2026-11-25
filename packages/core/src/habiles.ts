/**
 * Días hábiles en México.
 *
 * Hábil = lunes a viernes, menos los días de descanso obligatorio del artículo
 * 74 de la Ley Federal del Trabajo. Las jornadas electorales y los días que
 * cada empresa da de más no entran: varían y nadie los tiene en un calendario
 * confiable. Si dirección decide otra regla, sólo cambia este archivo.
 *
 * Las cuentas se hacen en la hora del centro de México. Desde 2022 no hay
 * horario de verano, así que es UTC-6 fijo todo el año.
 */

const DESFASE_MS = -6 * 60 * 60 * 1000

/** La fecha "de pared" en el centro de México, representada en UTC. */
function aLocal(fecha: Date): Date {
  return new Date(fecha.getTime() + DESFASE_MS)
}

function deLocal(local: Date): Date {
  return new Date(local.getTime() - DESFASE_MS)
}

/** El n-ésimo lunes de un mes (mes de 0 a 11). */
function enesimoLunes(anio: number, mes: number, n: number): number {
  const primero = new Date(Date.UTC(anio, mes, 1)).getUTCDay()
  const primerLunes = 1 + ((8 - primero) % 7)
  return primerLunes + (n - 1) * 7
}

/** Los días de descanso obligatorio de un año, como "AAAA-MM-DD". */
export function feriados(anio: number): Set<string> {
  const f = (mes: number, dia: number) =>
    `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  const dias = [
    f(0, 1), // Año Nuevo
    f(1, enesimoLunes(anio, 1, 1)), // Constitución: primer lunes de febrero
    f(2, enesimoLunes(anio, 2, 3)), // Natalicio de Juárez: tercer lunes de marzo
    f(4, 1), // Día del Trabajo
    f(8, 16), // Independencia
    f(10, enesimoLunes(anio, 10, 3)), // Revolución: tercer lunes de noviembre
    f(11, 25), // Navidad
  ]
  // Transmisión del Poder Ejecutivo Federal: 1 de octubre, cada seis años (2024, 2030…).
  if (anio >= 2024 && (anio - 2024) % 6 === 0) dias.push(f(9, 1))
  return new Set(dias)
}

function clave(local: Date): string {
  return local.toISOString().slice(0, 10)
}

/** ¿Es hábil el día (en México) que contiene a este instante? */
export function esHabil(fecha: Date): boolean {
  const local = aLocal(fecha)
  const dia = local.getUTCDay()
  if (dia === 0 || dia === 6) return false
  return !feriados(local.getUTCFullYear()).has(clave(local))
}

function siguienteDia(local: Date): Date {
  const r = new Date(local.getTime())
  r.setUTCDate(r.getUTCDate() + 1)
  return r
}

/**
 * El instante en que se cumplen `n` días hábiles desde `desde`.
 *
 * Si `desde` cae en día inhábil, la cuenta empieza a las 00:00 del siguiente
 * hábil: una postulación del sábado empieza a contar el lunes. Si cae en día
 * hábil, se conserva la hora: la del lunes a las 10:00 vence el jueves a las
 * 10:00.
 */
export function sumarDiasHabiles(desde: Date, n: number): Date {
  let local = aLocal(desde)
  if (!esHabil(deLocal(local))) {
    local = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()))
    while (!esHabil(deLocal(local))) local = siguienteDia(local)
  }
  let restantes = n
  while (restantes > 0) {
    local = siguienteDia(local)
    if (esHabil(deLocal(local))) restantes--
  }
  return deLocal(local)
}
