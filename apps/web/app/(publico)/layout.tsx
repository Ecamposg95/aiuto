import Link from 'next/link'
import Image from 'next/image'
import { VERTICALES } from '@aiuto/core'
import { auth, esStaff, inicioSegunRol } from '@/auth'

export const dynamic = 'force-dynamic'

/**
 * El encabezado y el pie del sitio público.
 *
 * Vive aquí y no en la raíz porque los paneles traen su propia navegación:
 * apilar las dos deja al usuario con dos menús.
 *
 * Los menús son <details>: abren sin JavaScript y funcionan igual en el
 * teléfono. El menú general es el del máster prompt §4.
 */
export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const sesion = await auth()
  const rol = sesion?.user?.rol
  const cuenta = sesion?.user
    ? { ruta: inicioSegunRol(rol), texto: esStaff(rol) ? 'Ir al panel' : rol === 'EMPRESA' ? 'Mi panel' : 'Mi cuenta' }
    : { ruta: '/entrar', texto: 'Entrar' }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-px border-line bg-white">
        <div className="wrap flex items-center justify-between gap-4 py-3">
          <Link href="/" aria-label="AIUTO, inicio" className="shrink-0">
            <Image src="/aiuto-lockup.png" alt="AIUTO" width={136} height={46} priority />
          </Link>

          {/* Escritorio */}
          <nav className="hidden items-center gap-5 text-sm lg:flex" aria-label="Principal">
            <Link href="/" className="hover:text-purple">Inicio</Link>
            <Link href="/nosotros" className="hover:text-purple">Nosotros</Link>
            <details className="group relative">
              <summary className="cursor-pointer list-none hover:text-purple">
                Soluciones Empresariales <span aria-hidden>▾</span>
              </summary>
              <div className="absolute left-0 top-full z-30 mt-2 w-[20rem] rounded-tarjeta border-px border-line bg-white p-2 shadow-lg">
                {VERTICALES.map((v) => (
                  <Link
                    key={v.slug}
                    href={`/soluciones/${v.slug}`}
                    className="flex items-center gap-3 rounded-control px-3 py-2 hover:bg-off"
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: v.color }} aria-hidden />
                    {v.nombre}
                  </Link>
                ))}
                <Link href="/soluciones" className="mt-1 block border-t-px border-line px-3 pt-2 text-purple">
                  Ver todas
                </Link>
              </div>
            </details>
            <Link href="/bolsa" className="hover:text-purple">Bolsa de Trabajo</Link>
            <Link href="/empleabilidad" className="hover:text-purple">Empleabilidad</Link>
            <Link href="/contacto" className="hover:text-purple">Contacto</Link>
            <Link href={cuenta.ruta} className="btn-secundario px-3 py-[6px] text-sm">
              {cuenta.texto}
            </Link>
          </nav>

          {/* Teléfono */}
          <details className="lg:hidden">
            <summary className="btn-secundario cursor-pointer list-none px-3 py-[6px] text-sm">Menú</summary>
            <nav
              className="absolute inset-x-0 top-[70px] z-30 border-b-px border-line bg-white px-5 pb-5 shadow-lg"
              aria-label="Principal"
            >
              <ul className="grid gap-1 text-body">
                <li><Link href="/" className="block py-2">Inicio</Link></li>
                <li><Link href="/nosotros" className="block py-2">Nosotros</Link></li>
                <li>
                  <p className="pt-2 text-sm text-neutral">Soluciones Empresariales</p>
                  <ul className="mt-1 grid gap-1 pl-3">
                    {VERTICALES.map((v) => (
                      <li key={v.slug}>
                        <Link href={`/soluciones/${v.slug}`} className="flex items-center gap-2 py-[6px]">
                          <span className="h-[10px] w-[10px] rounded-full" style={{ backgroundColor: v.color }} aria-hidden />
                          {v.nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li><Link href="/bolsa" className="block py-2">Bolsa de Trabajo</Link></li>
                <li><Link href="/empleabilidad" className="block py-2">Empleabilidad</Link></li>
                <li><Link href="/contacto" className="block py-2">Contacto</Link></li>
                <li><Link href={cuenta.ruta} className="btn mt-2 w-full">{cuenta.texto}</Link></li>
              </ul>
            </nav>
          </details>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-7 border-t-px border-line bg-off">
        <div className="wrap grid gap-8 py-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image src="/aiuto-lockup.png" alt="AIUTO" width={110} height={37} />
            <p className="mt-3 max-w-[30ch] text-ink-2">El ecosistema que conecta necesidades con soluciones.</p>
          </div>
          <div>
            <p className="label">Empresas</p>
            <ul className="mt-2 grid gap-1">
              <li><Link href="/soluciones" className="hover:text-purple">Soluciones Empresariales</Link></li>
              <li><Link href="/empresas/registro" className="hover:text-purple">Publicar vacantes</Link></li>
            </ul>
          </div>
          <div>
            <p className="label">Personas</p>
            <ul className="mt-2 grid gap-1">
              <li><Link href="/bolsa" className="hover:text-purple">Bolsa de Trabajo</Link></li>
              <li><Link href="/sueldos" className="hover:text-purple">Sueldos</Link></li>
              <li><Link href="/empleabilidad" className="hover:text-purple">Empleabilidad</Link></li>
            </ul>
          </div>
          <div>
            <p className="label">AIUTO</p>
            <ul className="mt-2 grid gap-1">
              <li><Link href="/nosotros" className="hover:text-purple">Nosotros</Link></li>
              <li><Link href="/contacto" className="hover:text-purple">Contacto</Link></li>
              <li><Link href="/privacidad" className="hover:text-purple">Aviso de privacidad</Link></li>
            </ul>
          </div>
        </div>
        <p className="wrap pb-6 text-sm text-neutral">© {new Date().getFullYear()} AIUTO</p>
      </footer>
    </div>
  )
}
