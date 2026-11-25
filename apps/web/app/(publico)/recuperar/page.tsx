import Link from 'next/link'
import type { Metadata } from 'next'
import { FormaPedir } from './FormaPedir'

export const metadata: Metadata = { title: 'Recuperar contraseña', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default function Recuperar() {
  return (
    <div className="wrap py-8">
      <div className="max-w-[26rem]">
        <h1 className="text-h1">Recuperar tu contraseña</h1>
        <p className="mt-3 text-ink-2">Te mandamos una liga a tu correo para elegir una nueva.</p>
        <FormaPedir />
        <p className="mt-5 text-sm text-ink-2">
          ¿Ya la recordaste?{' '}
          <Link href="/entrar" className="text-purple underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
