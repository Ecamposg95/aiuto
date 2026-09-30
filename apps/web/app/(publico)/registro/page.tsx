import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, inicioSegunRol } from '@/auth'
import { FormaRegistro } from './FormaRegistro'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta para seguir tus postulaciones.',
}
export const dynamic = 'force-dynamic'

export default async function Registro() {
  const sesion = await auth()
  if (sesion?.user) redirect(inicioSegunRol(sesion.user.rol))

  return (
    <div className="wrap max-w-[42ch] py-8">
      <p className="label">Candidatos</p>
      <h1 className="mt-3 text-h1">Crear cuenta</h1>
      <p className="mt-4 text-ink-2">
        Para que no tengas que preguntarle a nadie en qué va tu postulación.
      </p>

      <FormaRegistro />

      <p className="mt-5 text-sm text-ink-2">
        ¿Ya tienes cuenta?{' '}
        <Link href="/entrar" className="text-purple underline">
          Entra aquí
        </Link>
        . Al registrarte aceptas el{' '}
        <Link href="/privacidad" className="text-purple underline">
          aviso de privacidad
        </Link>
        .
      </p>
    </div>
  )
}
