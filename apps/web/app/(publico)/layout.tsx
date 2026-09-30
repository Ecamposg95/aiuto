import Link from 'next/link'
import { auth, esStaff } from '@/auth'

export const dynamic = 'force-dynamic'

const SITIO = 'https://aiuto.com.mx'

const SECCIONES = [
  ['/bolsa', 'Bolsa de trabajo'],
  ['/sueldos', 'Sueldos'],
  ['/asesoria', 'Asesoría'],
  ['/contacto', 'Contacto'],
] as const

/**
 * El encabezado y el pie del sitio público.
 *
 * Vive aquí y no en la raíz porque el panel y el área de candidato traen su
 * propia navegación: apilar las dos deja al usuario con dos menús y le quita a
 * la herramienta la sensación de ser una herramienta.
 */
export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const sesion = await auth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-rule border-ink">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/" className="text-h3 font-bold tracking-tight text-ink">
            AIUTO
          </Link>

          <nav className="flex flex-wrap items-center gap-5 text-sm">
            {SECCIONES.map(([ruta, etiqueta]) => (
              <Link key={ruta} href={ruta} className="text-ink transition hover:text-purple">
                {etiqueta}
              </Link>
            ))}

            {sesion?.user ? (
              <Link
                href={esStaff(sesion.user.rol) ? '/panel' : '/mi'}
                className="border-px border-purple px-3 py-1.5 text-purple transition hover:bg-purple hover:text-white"
              >
                {esStaff(sesion.user.rol) ? 'Ir al panel' : 'Mi cuenta'}
              </Link>
            ) : (
              <Link
                href="/entrar"
                className="border-px border-purple px-3 py-1.5 text-purple transition hover:bg-purple hover:text-white"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-8 border-t-rule border-ink bg-off">
        <div className="wrap flex flex-col gap-4 py-6 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AIUTO</p>
          <nav className="flex flex-wrap gap-5">
            <Link href="/privacidad" className="transition hover:text-purple">
              Aviso de privacidad
            </Link>
            <a href={SITIO} className="transition hover:text-purple">
              aiuto.com.mx
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
