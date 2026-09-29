import { prisma } from '@aiuto/db'
import { transicionesDesde, esEstadoFinal } from '@aiuto/core'
import { cambiarEstadoPostulacion } from '@/lib/acciones'

export const dynamic = 'force-dynamic'

const ETIQUETA = {
  RECIBIDA: 'Recibida',
  EN_REVISION: 'En revisión',
  ENTREVISTA: 'Entrevista',
  CONTRATADA: 'Contratada',
  RECHAZADA: 'Rechazada',
  VACANTE_CUBIERTA: 'Vacante cubierta',
} as const

export default async function PanelPostulaciones() {
  const postulaciones = await prisma.postulacion.findMany({
    include: { vacante: { include: { company: true } } },
    orderBy: { creadoEn: 'desc' },
    take: 200,
  })
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

  return (
    <>
      <h1 className="text-h2">Postulaciones</h1>
      <p className="mt-3 max-w-[62ch] text-sm text-ink-2">
        Cada cambio de estado aquí es lo que la persona ve en su liga de seguimiento. Mover una
        postulación no es trámite interno: es responderle a alguien.
      </p>

      {postulaciones.length === 0 ? (
        <p className="mt-6 border-t-rule border-ink pt-5 text-ink-2">Todavía no hay ninguna.</p>
      ) : (
        <ul className="mt-6">
          {postulaciones.map((p) => {
            const siguientes = transicionesDesde(p.estado)
            return (
              <li key={p.id} className="border-t-rule border-ink py-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-label uppercase text-neutral">{ETIQUETA[p.estado]}</span>
                  <span className="text-sm text-neutral">{fecha.format(p.creadoEn)}</span>
                </div>

                <h2 className="mt-2 text-h3">{p.nombre}</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {p.correo}
                  {p.telefono ? ` · ${p.telefono}` : ''}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {p.vacante.puesto} · {p.vacante.company.nombre}
                </p>
                {p.mensaje && (
                  <p className="mt-3 border-l-rule border-line pl-4 text-sm text-ink-2">
                    {p.mensaje}
                  </p>
                )}

                {esEstadoFinal(p.estado) ? (
                  <p className="mt-3 text-sm text-neutral">Esta postulación ya se cerró.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {siguientes.map((destino) => (
                      <form key={destino} action={cambiarEstadoPostulacion}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="estado" value={destino} />
                        <button className="btn-secundario px-3 py-2 text-sm">
                          {ETIQUETA[destino]}
                        </button>
                      </form>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
