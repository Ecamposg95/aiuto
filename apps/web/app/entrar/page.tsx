import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, esStaff } from '@/auth'
import { FormaEntrar } from './FormaEntrar'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Entrar() {
  const sesion = await auth()
  if (sesion?.user && esStaff(sesion.user.rol)) redirect('/panel')

  return (
    <div className="wrap max-w-[40ch] py-8">
      <p className="label">Equipo AIUTO</p>
      <h1 className="mt-3 text-h1">Entrar al panel</h1>
      <FormaEntrar />
      <p className="mt-5 text-sm text-ink-2">
        Las cuentas del equipo se crean a mano. Si necesitas una, pídesela a quien administra.
      </p>
    </div>
  )
}
