import { redirect } from 'next/navigation'
import { prisma } from '@aiuto/db'
import { auth, esStaff, esEmpresa, inicioSegunRol } from '@/auth'

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
  if (usuario.rol !== 'CANDIDATO') redirect(inicioSegunRol(usuario.rol))
  return usuario
}

export async function exigirStaff() {
  const usuario = await exigirSesion()
  if (!esStaff(usuario.rol)) redirect(inicioSegunRol(usuario.rol))
  return usuario
}

/** Sólo el administrador: usuarios, empresas y licencias. */
export async function exigirAdmin() {
  const usuario = await exigirStaff()
  if (usuario.rol !== 'STAFF_ADMIN') redirect('/panel')
  return usuario
}

/**
 * Reclutador de empresa con su empresa. La empresa se lee de la base en cada
 * petición y no del token: si el administrador la suspende, deja de entrar en
 * ese momento y no cuando venza la sesión.
 */
export async function exigirEmpresa() {
  const usuario = await exigirSesion()
  if (!esEmpresa(usuario.rol)) redirect(inicioSegunRol(usuario.rol))
  const membresia = await prisma.companyMember.findUnique({
    where: { userId: usuario.id },
    include: { company: true },
  })
  if (!membresia) redirect('/entrar')
  return { usuario, empresa: membresia.company }
}

/** Empresa aprobada. Mientras está pendiente o suspendida, sólo ve su resumen. */
export async function exigirEmpresaAprobada() {
  const r = await exigirEmpresa()
  if (r.empresa.estado !== 'APROBADA') redirect('/reclutamiento')
  return r
}
