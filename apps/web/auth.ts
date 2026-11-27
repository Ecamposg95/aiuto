import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma, type Rol } from '@aiuto/db'

/**
 * Autenticación de todos: equipo, empresas y candidatos.
 *
 * Los permisos son un campo `rol`, no un sistema. El equipo se crea con
 * `pnpm crear-staff`; en /panel/usuarios el administrador cambia el rol dentro
 * del equipo y desactiva o reactiva cuentas.
 *
 * El rol y el estado de la cuenta se releen de la base en cada petición (callback
 * `jwt`): si el administrador desactiva una cuenta o le cambia el rol, surte
 * efecto en ese momento y no cuando vence el token, ocho horas después.
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
        // Misma respuesta que una contraseña equivocada: no se revela que la cuenta existe.
        if (usuario.desactivadoEn) return null

        // Entran todos los roles. Quien puede ver qué lo decide cada zona:
        // /panel exige staff, /reclutamiento exige empresa y /mi exige candidato.
        return { id: usuario.id, email: usuario.email, name: usuario.nombre, rol: usuario.rol }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = (user as { rol?: Rol }).rol
        token.sub = user.id
        return token
      }
      if (!token.sub) return null
      // Devolver null cierra la sesión: la cuenta ya no existe o fue desactivada.
      const actual = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { rol: true, desactivadoEn: true },
      })
      if (!actual || actual.desactivadoEn) return null
      token.rol = actual.rol
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
  return ROLES_STAFF.includes(rol as Rol)
}

/** ¿Esta sesión es de un reclutador de empresa? */
export function esEmpresa(rol: string | undefined): boolean {
  return rol === 'EMPRESA'
}

/** A dónde mandar a alguien después de entrar, según quién sea. */
export function inicioSegunRol(rol: string | undefined): string {
  if (esStaff(rol)) return '/panel'
  if (esEmpresa(rol)) return '/reclutamiento'
  return '/mi'
}
