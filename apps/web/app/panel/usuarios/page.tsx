import { prisma, type Rol } from '@aiuto/db'
import { exigirAdmin } from '@/lib/sesion'

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
 */
export default async function PanelUsuarios({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await exigirAdmin()
  const { q } = await searchParams
  const busqueda = q?.trim()

  const [porRol, usuarios] = await Promise.all([
    prisma.user.groupBy({ by: ['rol'], _count: true }),
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
      <dl className="mt-5 grid gap-4 sm:grid-cols-4">
        {(Object.keys(ROL) as Rol[]).map((r) => (
          <div key={r} className="border-t-px border-line pt-3">
            <dd className="cifra">{porRol.find((p) => p.rol === r)?._count ?? 0}</dd>
            <dt className="text-sm text-ink-2">{ROL[r]}</dt>
          </div>
        ))}
      </dl>

      <form className="mt-6 flex gap-2">
        <input name="q" defaultValue={busqueda} placeholder="Buscar por nombre o correo" className="campo max-w-sm" />
        <button className="btn-secundario px-4">Buscar</button>
      </form>

      <table className="tabla mt-5 w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Nombre</th>
            <th className="text-left">Correo</th>
            <th className="text-left">Rol</th>
            <th className="text-left">Alta</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre ?? '—'}</td>
              <td>
                {u.email} {!u.emailVerified && <span className="text-neutral">(sin confirmar)</span>}
              </td>
              <td>
                {ROL[u.rol]}
                {u.membresia && <span className="text-ink-2"> · {u.membresia.company.nombre}</span>}
              </td>
              <td className="cifras">{fecha.format(u.creadoEn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
