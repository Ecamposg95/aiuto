import Link from 'next/link'
import type { Metadata } from 'next'
import { fichaValida } from '@/lib/fichas'
import { FormaNueva } from './FormaNueva'

export const metadata: Metadata = { title: 'Contraseña nueva', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function ContrasenaNueva({ params }: { params: Promise<{ ficha: string }> }) {
  const { ficha } = await params
  const valida = await fichaValida('restablecer', ficha)

  return (
    <div className="wrap py-8">
      <div className="max-w-[26rem]">
        {valida ? (
          <>
            <h1 className="text-h1">Elige tu contraseña nueva</h1>
            <FormaNueva ficha={ficha} />
          </>
        ) : (
          <>
            <h1 className="text-h1">Esta liga no sirve o ya venció</h1>
            <p className="mt-3 text-ink-2">Las ligas duran una hora y sirven una sola vez.</p>
            <Link href="/recuperar" className="btn mt-5">
              Pedir una liga nueva
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
