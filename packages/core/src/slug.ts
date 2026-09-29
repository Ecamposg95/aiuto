/**
 * Slugs para las URLs públicas.
 *
 * Vive en `core` porque una URL publicada es un compromiso: si el algoritmo
 * cambia, las ligas que la gente compartió dejan de servir.
 */

const LARGO_MAX = 80

export function generarSlug(...partes: string[]): string {
  const crudo = partes.filter(Boolean).join(' ')

  const limpio = crudo
    .normalize('NFD')
    // Quita los diacríticos que la descomposición separó: café -> cafe.
    .replace(/[̀-ͯ]/g, '')
    // La eñe no se descompone en NFD, va aparte.
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (limpio.length <= LARGO_MAX) return limpio
  return limpio.slice(0, LARGO_MAX).replace(/-+[^-]*$/, '').replace(/-+$/, '')
}
