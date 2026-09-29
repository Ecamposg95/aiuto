import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth, inicioSegunRol } from '@/auth'
import { FormaEntrar } from './FormaEntrar'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Entrar() {
  const sesion = await auth()
  if (sesion?.user) redirect(inicioSegunRol(sesion.user.rol))

  return (
    <div className="wrap max-w-[40ch] py-8">
      <p className="label">Equipo AIUTO</p>
      <h1 className="mt-3 text-h1">Entrar al panel</h1>
      <FormaEntrar />
      <p className="mt-5 text-sm text-ink-2">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-purple underline">
          Crea una
        </Link>
        . Las del equipo AIUTO se crean a mano.
      </p>
    </div>
  )
}
