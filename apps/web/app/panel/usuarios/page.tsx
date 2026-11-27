import { prisma, type Rol } from '@aiuto/db'
import { exigirAdmin } from '@/lib/sesion'
import { cambiarRolEquipo, cambiarActivacion } from '@/lib/accionesAdmin'

export const dynamic = 'force-dynamic'

const ROL: Record<Rol, string> = {
  STAFF_ADMIN: 'Administración',
  STAFF_OPERADOR: 'Operación',
  EMPRESA: 'Empresa',
  CANDIDATO: 'Candidato',
}

/**
 * Quién tiene cuenta y con qué permisos. Los permisos son el rol: el equipo se
 * crea con `pnpm crear-staff`; las empresas, al aprobarse; los candidatos, solos.
 *
 * Aquí el administrador cambia el rol dentro del equipo y desactiva o reactiva
 * cuentas. Nunca sobre la suya, y nunca deja el panel sin administrador activo.
 */
export default async function PanelUsuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const yo = await exigirAdmin()
  const { q } = await searchParams
  const busqueda = q?.trim()

  const [porRol, desactivadas, usuarios] = await Promise.all([
    prisma.user.groupBy({ by: ['rol'], _count: true }),
    prisma.user.count({ where: { desactivadoEn: { not: null } } }),
    prisma.user.findMany({
      where: busqueda
        ? { OR: [{ email: { contains: busqueda, mode: 'insensitive' } }, { nombre: { contains: busqueda, mode: 'insensitive' } }] }
        : undefined,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        emailVerified: true,
        desactivadoEn: true,
        creadoEn: true,
        membresia: { select: { company: { select: { nombre: true } } } },
      },
      orderBy: [{ rol: 'asc' }, { creadoEn: 'desc' }],
      take: 200,
    }),
  ])
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

  return (
    <>
      <h1 className="text-h2">Usuarios</h1>
      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {(Object.keys(ROL) as Rol[]).map((r) => (
          <div key={r} className="border-t-px border-line pt-3">
            <dd className="cifra">{porRol.find((p) => p.rol === r)?._count ?? 0}</dd>
            <dt className="text-sm text-ink-2">{ROL[r]}</dt>
          </div>
        ))}
        <div className="border-t-px border-line pt-3">
          <dd className="cifra">{desactivadas}</dd>
          <dt className="text-sm text-ink-2">Desactivadas</dt>
        </div>
      </dl>

      <form className="mt-6 flex gap-2">
        <input name="q" defaultValue={busqueda} placeholder="Buscar por nombre o correo" className="campo max-w-sm" />
        <button className="btn-secundario px-4">Buscar</button>
      </form>

      <div className="mt-5 overflow-x-auto">
      <table className="tabla w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Nombre</th>
            <th className="text-left">Correo</th>
            <th className="text-left">Rol</th>
            <th className="text-left">Alta</th>
            <th className="text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => {
            const esYo = u.id === yo.id
            const equipo = u.rol === 'STAFF_ADMIN' || u.rol === 'STAFF_OPERADOR'
            return (
            <tr key={u.id} className={u.desactivadoEn ? 'text-neutral' : undefined}>
              <td>
                {u.nombre ?? '—'}
                {u.desactivadoEn && <span className="ml-2 estado">Desactivada</span>}
              </td>
              <td>
                {u.email} {!u.emailVerified && <span className="text-neutral">(sin confirmar)</span>}
              </td>
              <td>
                {ROL[u.rol]}
                {u.membresia && <span className="text-ink-2"> · {u.membresia.company.nombre}</span>}
              </td>
              <td className="cifras">{fecha.format(u.creadoEn)}</td>
              <td>
                {esYo ? (
                  <span className="text-neutral">Tu cuenta</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {equipo && (
                      <form action={cambiarRolEquipo}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="rol" value={u.rol === 'STAFF_ADMIN' ? 'STAFF_OPERADOR' : 'STAFF_ADMIN'} />
                        <button className="border-px border-line px-3 py-[6px] text-ink-2 hover:border-ink">
                          {u.rol === 'STAFF_ADMIN' ? 'Pasar a operación' : 'Hacer administrador'}
                        </button>
                      </form>
                    )}
                    <form action={cambiarActivacion}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="activar" value={u.desactivadoEn ? 'si' : 'no'} />
                      <button className="border-px border-line px-3 py-[6px] text-ink-2 hover:border-ink">
                        {u.desactivadoEn ? 'Reactivar' : 'Desactivar'}
                      </button>
                    </form>
                  </div>
                )}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </>
  )
}
