import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma, type Rol } from '@aiuto/db'

/**
 * Autenticación del equipo AIUTO.
 *
 * Con tres personas, los permisos son un campo `rol`, no un sistema: no hay
 * pantalla de administración de usuarios y las cuentas se crean a mano con
 * `pnpm crear-staff`.
 *
 * Estrategia JWT porque el proveedor de credenciales de Auth.js no trabaja con
 * sesiones en base. Cuando llegue el acceso de candidatos con Google (Entrega 2)
 * se suma el proveedor y se revisa la estrategia.
 */

const ROLES_STAFF: Rol[] = ['STAFF_ADMIN', 'STAFF_OPERADOR']

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/entrar' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credenciales) {
        const email = String(credenciales?.email ?? '').trim().toLowerCase()
        const password = String(credenciales?.password ?? '')
        if (!email || !password) return null

        const usuario = await prisma.user.findUnique({ where: { email } })

        // Se compara siempre, exista o no la cuenta: si sólo se comparara cuando
        // existe, el tiempo de respuesta delataría qué correos están dados de alta.
        const hash = usuario?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv'
        const coincide = await bcrypt.compare(password, hash)

        if (!usuario || !usuario.passwordHash || !coincide) return null
        if (!ROLES_STAFF.includes(usuario.rol)) return null

        return { id: usuario.id, email: usuario.email, name: usuario.nombre, rol: usuario.rol }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.rol = (user as { rol?: Rol }).rol
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol as Rol
        // Con estrategia JWT el id vive en `sub` y no llega solo a la sesion.
        // Sin esto las acciones del panel rechazaban a usuarios que si habian
        // entrado, porque comprueban `sesion.user.id`.
        if (token.sub) session.user.id = token.sub
      }
      return session
    },
  },
})

/** ¿Esta sesión pertenece al equipo? */
export function esStaff(rol: string | undefined): boolean {
  return rol === 'STAFF_ADMIN' || rol === 'STAFF_OPERADOR'
}
