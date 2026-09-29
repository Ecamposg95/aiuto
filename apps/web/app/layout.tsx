import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import Link from 'next/link'
import { auth, esStaff } from '@/auth'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AIUTO — Bolsa de trabajo con sueldo a la vista',
    template: '%s · AIUTO',
  },
  description:
    'Vacantes que declaran sueldo, prestaciones, horario y cuántas entrevistas tiene el proceso. Y te decimos en qué va tu postulación.',
}

const SITIO = 'https://aiuto.com.mx'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sesion = await auth()
  return (
    <html lang="es-MX" className={archivo.variable}>
      <body className="flex min-h-screen flex-col">
        <header className="border-b-rule border-ink">
          <div className="wrap flex items-center justify-between gap-5 py-4">
            <Link href="/" className="text-h3 font-bold tracking-tight text-ink">
              AIUTO
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/bolsa" className="text-ink hover:text-purple">
                Bolsa de trabajo
              </Link>
              <Link href="/asesoria" className="text-ink hover:text-purple">
                Asesoría
              </Link>
              <Link href="/contacto" className="text-ink hover:text-purple">
                Contacto
              </Link>
              {sesion?.user ? (
                <Link
                  href={esStaff(sesion.user.rol) ? '/panel' : '/mi'}
                  className="text-purple hover:text-purple-700"
                >
                  {esStaff(sesion.user.rol) ? 'Panel' : 'Mi cuenta'}
                </Link>
              ) : (
                <Link href="/entrar" className="text-purple hover:text-purple-700">
                  Entrar
                </Link>
              )}
              <a href={SITIO} className="hidden text-neutral hover:text-purple lg:inline">
                Sitio AIUTO
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="rule mt-8 bg-off">
          <div className="wrap flex flex-col gap-4 py-6 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} AIUTO</p>
            <nav className="flex flex-wrap gap-5">
              <Link href="/privacidad" className="hover:text-purple">
                Aviso de privacidad
              </Link>
              <a href={SITIO} className="hover:text-purple">
                aiuto.com.mx
              </a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}
