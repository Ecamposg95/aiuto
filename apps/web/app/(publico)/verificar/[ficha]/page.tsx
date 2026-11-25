import Link from 'next/link'
import type { Metadata } from 'next'
import { fichaValida } from '@/lib/fichas'
import { FormaConfirmar } from './FormaConfirmar'

export const metadata: Metadata = { title: 'Confirmar correo', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Verificar({ params }: { params: Promise<{ ficha: string }> }) {
  const { ficha } = await params
  // Sólo se revisa, no se consume: ver confirmarCorreo.
  const valida = await fichaValida('verificar', ficha)

  return (
    <div className="wrap py-8">
      <div className="max-w-[34rem]">
        {valida ? (
          <>
            <h1 className="text-h1">Confirma tu correo</h1>
            <p className="mt-3 text-ink-2">
              Al confirmarlo verás en tu cuenta las postulaciones que hayas hecho con este correo.
            </p>
            <FormaConfirmar ficha={ficha} />
          </>
        ) : (
          <>
            <h1 className="text-h1">Esta liga no sirve o ya venció</h1>
            <p className="mt-3 text-ink-2">Entra a tu cuenta y pide una liga nueva desde ahí.</p>
            <Link href="/mi" className="btn mt-5">
              Ir a mi cuenta
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
