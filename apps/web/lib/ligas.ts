/**
 * Una liga capturada por un usuario, sólo si es http o https. Defensa de
 * respaldo: las formas ya validan, pero una `javascript:` que se cuele en un
 * `href` ejecuta código en la sesión de quien la abre (otra empresa, el equipo).
 */
export function ligaSegura(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}
