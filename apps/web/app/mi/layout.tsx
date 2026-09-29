import Link from 'next/link'
import { exigirCandidato } from '@/lib/sesion'
import { SalirBoton } from '@/app/panel/SalirBoton'

export const dynamic = 'force-dynamic'

/** Todo lo que cuelga de /mi exige sesión. El equipo tiene su propia zona. */
export default async function MiLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirCandidato()

  return (
    <div className="wrap max-w-[75ch] py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-rule border-ink pb-4">
        <div>
          <p className="label">Mi cuenta</p>
          <p className="mt-1 text-sm text-ink-2">{usuario.nombre ?? usuario.email}</p>
        </div>
        <SalirBoton />
      </div>

      <nav className="mt-4 flex flex-wrap gap-2">
        <Link href="/mi" className="border-px border-line px-3 py-2 text-sm transition hover:border-ink">
          Mis postulaciones
        </Link>
        <Link href="/mi/perfil" className="border-px border-line px-3 py-2 text-sm transition hover:border-ink">
          Mi perfil
        </Link>
        <Link href="/bolsa" className="border-px border-line px-3 py-2 text-sm transition hover:border-ink">
          Ver vacantes
        </Link>
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  )
}
