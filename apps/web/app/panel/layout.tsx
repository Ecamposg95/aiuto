import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, esStaff } from '@/auth'
import { SalirBoton } from './SalirBoton'

export const dynamic = 'force-dynamic'

const SECCIONES = [
  ['/panel', 'Bandeja'],
  ['/panel/vacantes', 'Vacantes'],
  ['/panel/postulaciones', 'Postulaciones'],
  ['/panel/asesorias', 'Asesorías'],
] as const

/**
 * Todo lo que cuelga de /panel exige sesión del equipo. La comprobación vive
 * aquí y no en un middleware porque el cliente de Prisma no corre en el runtime
 * de borde, y partir la configuración de Auth.js en dos para eso sería pagar
 * complejidad sin recibir nada.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const sesion = await auth()
  if (!sesion?.user || !esStaff(sesion.user.rol)) redirect('/entrar')

  return (
    <div className="wrap py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-rule border-ink pb-4">
        <div>
          <p className="label">Panel interno</p>
          <p className="mt-1 text-sm text-ink-2">
            {sesion.user.name ?? sesion.user.email}
            <span className="ml-2 text-neutral">
              {sesion.user.rol === 'STAFF_ADMIN' ? 'Administración' : 'Operación'}
            </span>
          </p>
        </div>
        <SalirBoton />
      </div>

      <nav className="mt-4 flex flex-wrap gap-2">
        {SECCIONES.map(([ruta, etiqueta]) => (
          <Link
            key={ruta}
            href={ruta}
            className="border-px border-line px-3 py-2 text-sm transition hover:border-ink"
          >
            {etiqueta}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  )
}
