import { redirect } from 'next/navigation'
import { auth, esStaff } from '@/auth'

/**
 * Sesión garantizada, o redirección.
 *
 * Cada página la llama por su cuenta en vez de confiar en el layout: en el App
 * Router el layout y la página se renderizan en paralelo, así que el `redirect`
 * del layout no impide que la página corra. Confiar en él da páginas que se
 * caen con "Cannot read properties of null".
 */
export async function exigirSesion() {
  const sesion = await auth()
  const usuario = sesion?.user
  if (!usuario?.id || !usuario.email) redirect('/entrar')
  return { id: usuario.id, email: usuario.email, nombre: usuario.name ?? null, rol: usuario.rol }
}

export async function exigirCandidato() {
  const usuario = await exigirSesion()
  if (esStaff(usuario.rol)) redirect('/panel')
  return usuario
}

export async function exigirStaff() {
  const usuario = await exigirSesion()
  if (!esStaff(usuario.rol)) redirect('/mi')
  return usuario
}
