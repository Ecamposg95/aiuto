import { prisma, type EstadoEmpresa } from '@aiuto/db'
import { exigirAdmin } from '@/lib/sesion'
import { cambiarEstadoEmpresa, asignarLicencia, suspenderLicencia } from '@/lib/accionesAdmin'

export const dynamic = 'force-dynamic'

const ETIQUETA: Record<EstadoEmpresa, string> = {
  PENDIENTE: 'Por aprobar',
  APROBADA: 'Aprobada',
  SUSPENDIDA: 'Suspendida',
  RECHAZADA: 'Rechazada',
}

export default async function PanelEmpresas() {
  await exigirAdmin()
  const ahora = new Date()
  const empresas = await prisma.company.findMany({
    include: {
      miembros: { include: { user: { select: { nombre: true, email: true } } } },
      licencias: { where: { estado: 'ACTIVA' }, orderBy: { creadoEn: 'desc' }, take: 1 },
      _count: { select: { vacantes: { where: { estado: 'ABIERTA' } } } },
    },
    orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
  })
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

  // Las que se registraron solas, primero; las que da de alta el equipo (sin cuenta) al final.
  const conCuenta = empresas.filter((e) => e.miembros.length > 0)
  const sinCuenta = empresas.filter((e) => e.miembros.length === 0)

  return (
    <>
      <h1 className="text-h2">Empresas</h1>
      <p className="mt-3 max-w-[64ch] text-ink-2">
        Las empresas con cuenta publican y contactan solas. Aquí se aprueban y se les asigna
        cuántas vacantes pueden tener abiertas.
      </p>

      <section className="mt-7">
        <h2 className="text-h3 border-b-rule border-ink pb-2">Con cuenta <span className="cifras text-sm text-neutral">{conCuenta.length}</span></h2>
        {conCuenta.length === 0 && <p className="mt-4 text-ink-2">Ninguna empresa se ha registrado todavía.</p>}
        <ul>
          {conCuenta.map((e) => {
            const lic = e.licencias[0]
            const vigente = lic && (!lic.terminaEn || lic.terminaEn > ahora)
            return (
              <li key={e.id} className="border-b-px border-line py-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`estado ${e.estado === 'PENDIENTE' ? 'estado--abierto' : e.estado === 'APROBADA' ? 'estado--espera' : 'estado--cerrado'}`}>
                    {ETIQUETA[e.estado]}
                  </span>
                  <span className="text-h4">{e.nombre}</span>
                  <span className="cifras text-sm text-neutral">desde {fecha.format(e.creadoEn)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {e.ubicacion}
                  {e.sitio && <> · {e.sitio}</>}
                </p>
                {e.descripcion && <p className="mt-1 max-w-[68ch] text-sm text-ink-2">{e.descripcion}</p>}
                <p className="mt-1 text-sm">
                  {e.miembros.map((m) => `${m.user.nombre ?? ''} <${m.user.email}>`).join(', ')}
                  {e.contactoTel && <span className="cifras"> · {e.contactoTel}</span>}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {vigente
                    ? `Licencia: ${e._count.vacantes} de ${lic.vacantesActivas} vacantes abiertas${lic.terminaEn ? `, hasta el ${fecha.format(lic.terminaEn)}` : ', sin vencimiento'}`
                    : 'Sin licencia vigente'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {e.estado !== 'APROBADA' && (
                    <Boton id={e.id} estado="APROBADA" texto="Aprobar" principal />
                  )}
                  {e.estado === 'PENDIENTE' && <Boton id={e.id} estado="RECHAZADA" texto="Rechazar" />}
                  {e.estado === 'APROBADA' && <Boton id={e.id} estado="SUSPENDIDA" texto="Suspender" />}
                  {vigente && (
                    <form action={suspenderLicencia}>
                      <input type="hidden" name="companyId" value={e.id} />
                      <button className="border-px border-line px-3 py-2 text-sm text-ink-2 hover:border-ink">Quitar licencia</button>
                    </form>
                  )}
                </div>

                {e.estado === 'APROBADA' && (
                  <form action={asignarLicencia} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="companyId" value={e.id} />
                    <label className="block">
                      <span className="label block">Vacantes abiertas a la vez</span>
                      <input type="number" name="vacantesActivas" min={1} max={500} required defaultValue={lic?.vacantesActivas ?? 3} className="campo mt-1 w-[8rem]" />
                    </label>
                    <label className="block">
                      <span className="label block">Vence (opcional)</span>
                      <input type="date" name="terminaEn" className="campo mt-1" />
                    </label>
                    <label className="block">
                      <span className="label block">Nota interna</span>
                      <input type="text" name="nota" maxLength={300} className="campo mt-1" />
                    </label>
                    <button className="btn-secundario px-3 py-2 text-sm">{vigente ? 'Cambiar licencia' : 'Asignar licencia'}</button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-h3 border-b-rule border-ink pb-2">Sin cuenta <span className="cifras text-sm text-neutral">{sinCuenta.length}</span></h2>
        <p className="mt-3 text-sm text-ink-2">Las da de alta el equipo al capturar sus vacantes.</p>
        <ul className="mt-2">
          {sinCuenta.map((e) => (
            <li key={e.id} className="border-b-px border-line py-3">
              {e.nombre} <span className="text-sm text-ink-2">· {e._count.vacantes} abiertas</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Boton({ id, estado, texto, principal }: { id: string; estado: string; texto: string; principal?: boolean }) {
  return (
    <form action={cambiarEstadoEmpresa}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <button className={principal ? 'btn px-4 py-2 text-sm' : 'border-px border-line px-3 py-2 text-sm text-ink-2 hover:border-ink'}>
        {texto}
      </button>
    </form>
  )
}
