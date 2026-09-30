'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Seccion = { ruta: string; etiqueta: string; pendientes?: number }

/**
 * El riel de navegación del panel.
 *
 * Es lo que hace que trabajar aquí se sienta como estar dentro de una consola y
 * no visitando páginas sueltas: no se mueve, marca dónde estás, y trae los
 * pendientes a la vista sin que haya que entrar a buscarlos.
 */
export function Riel({ secciones, usuario }: { secciones: Seccion[]; usuario: string }) {
  const ruta = usePathname()

  return (
    <div className="riel flex h-full flex-col">
      <div className="border-b-px border-purple-900 px-5 py-5">
        <Link href="/panel" className="text-h3 font-bold tracking-tight text-white">
          AIUTO
        </Link>
        <p className="mt-1 text-sm text-line">Operación</p>
      </div>

      <nav className="flex-1 py-3" aria-label="Secciones del panel">
        {secciones.map((s) => {
          // La bandeja sólo está activa en su ruta exacta; las demás, también en
          // sus subrutas, para que editar una vacante siga marcando «Vacantes».
          const activa = s.ruta === '/panel' ? ruta === '/panel' : ruta.startsWith(s.ruta)
          return (
            <Link
              key={s.ruta}
              href={s.ruta}
              aria-current={activa ? 'page' : undefined}
              className="riel-enlace justify-between"
            >
              <span>{s.etiqueta}</span>
              {s.pendientes ? (
                <span className="cifras bg-purple px-2 py-0.5 text-sm font-semibold text-white">
                  {s.pendientes}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="border-t-px border-purple-900 px-5 py-4">
        <p className="text-sm text-white">{usuario}</p>
      </div>
    </div>
  )
}
