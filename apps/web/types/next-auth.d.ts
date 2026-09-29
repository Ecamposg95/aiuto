import type { Rol } from '@aiuto/db'
import 'next-auth'

declare module 'next-auth' {
  interface User {
    rol?: Rol
  }
  interface Session {
    user: {
      id?: string
      email?: string | null
      name?: string | null
      rol?: Rol
    }
  }
}
