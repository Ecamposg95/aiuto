import Link from 'next/link'
import { exigirCandidato } from '@/lib/sesion'
import { SalirBoton } from '@/app/panel/SalirBoton'

export const dynamic = 'force-dynamic'

const SECCIONES = [
  ['/mi', 'Mis postulaciones'],
  ['/mi/perfil', 'Mi perfil'],
  ['/bolsa', 'Buscar vacantes'],
] as const

export default async function MiLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirCandidato()
  const nombre = usuario.nombre ?? usuario.email

  return (
    <div className="wrap max-w-[78ch] py-6">
      <header className="border-b-rule border-ink pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral">Tu cuenta en AIUTO</p>
            <p className="mt-1 text-h2">{nombre}</p>
          </div>
          <SalirBoton />
        </div>

        <nav className="mt-5 flex flex-wrap gap-5" aria-label="Secciones de tu cuenta">
          {SECCIONES.map(([ruta, etiqueta]) => (
            <Link key={ruta} href={ruta} className="text-ink-2 transition hover:text-purple">
              {etiqueta}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mt-7">{children}</div>
    </div>
  )
}
