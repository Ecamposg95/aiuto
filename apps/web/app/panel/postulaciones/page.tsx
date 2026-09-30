import { prisma } from '@aiuto/db'
import { transicionesDesde, esEstadoFinal, formatearSueldo, type EstadoPostulacion } from '@aiuto/core'
import { cambiarEstadoPostulacion } from '@/lib/acciones'

export const dynamic = 'force-dynamic'

const ETIQUETA: Record<EstadoPostulacion, string> = {
  RECIBIDA: 'Sin revisar',
  EN_REVISION: 'En revisión',
  ENTREVISTA: 'En entrevista',
  CONTRATADA: 'Contratada',
  RECHAZADA: 'No siguió',
  VACANTE_CUBIERTA: 'Vacante cubierta',
}

/** Sin revisar pesa; lo que está en curso espera; lo cerrado se apaga. */
function tono(estado: EstadoPostulacion): string {
  if (estado === 'RECIBIDA') return 'estado--abierto'
  return esEstadoFinal(estado) ? 'estado--cerrado' : 'estado--espera'
}

export default async function PanelPostulaciones() {
  const postulaciones = await prisma.postulacion.findMany({
    include: { vacante: { include: { company: true, category: true } } },
    // Lo que nadie ha mirado, primero; después lo más viejo.
    orderBy: [{ estado: 'asc' }, { creadoEn: 'asc' }],
    take: 200,
  })

  const abiertas = postulaciones.filter((p) => !esEstadoFinal(p.estado))
  const cerradas = postulaciones.filter((p) => esEstadoFinal(p.estado))
  const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

  return (
    <>
      <h1 className="text-h2">Postulaciones</h1>
      <p className="mt-3 max-w-[64ch] text-ink-2">
        Mover una postulación aquí le llega a la persona. No es un trámite interno: es
        responderle a alguien que está esperando.
      </p>

      {postulaciones.length === 0 ? (
        <p className="mt-6 border-t-rule border-ink pt-5 text-ink-2">Todavía no hay ninguna.</p>
      ) : (
        <>
          <Grupo titulo="En curso" cuenta={abiertas.length} vacio="Ninguna abierta ahora mismo.">
            {abiertas.map((p) => (
              <Renglon key={p.id} p={p} fecha={fecha} />
            ))}
          </Grupo>

          {cerradas.length > 0 && (
            <Grupo titulo="Cerradas" cuenta={cerradas.length}>
              {cerradas.map((p) => (
                <Renglon key={p.id} p={p} fecha={fecha} />
              ))}
            </Grupo>
          )}
        </>
      )}
    </>
  )
}

function Grupo({
  titulo,
  cuenta,
  vacio,
  children,
}: {
  titulo: string
  cuenta: number
  vacio?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline gap-3 border-b-rule border-ink pb-2">
        <h2 className="text-h3">{titulo}</h2>
        <span className="cifras text-sm text-neutral">{cuenta}</span>
      </div>
      {cuenta === 0 && vacio ? <p className="mt-5 text-ink-2">{vacio}</p> : <ul>{children}</ul>}
    </section>
  )
}

type ConVacante = Awaited<ReturnType<typeof prisma.postulacion.findMany>>[number] & {
  vacante: { puesto: string; company: { nombre: string }; category: { corto: string; color: string; colorDark: string } }
}

function Renglon({ p, fecha }: { p: ConVacante; fecha: Intl.DateTimeFormat }) {
  const final = esEstadoFinal(p.estado)

  return (
    <li
      className={`renglon py-3 ${final ? 'opacity-70' : ''}`}
      style={{ borderLeftColor: p.vacante.category.color }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`estado ${tono(p.estado)}`}>{ETIQUETA[p.estado]}</span>
            <span className="cifras text-sm text-neutral">{fecha.format(p.creadoEn)}</span>
          </div>

          <p className="mt-2">
            <span className="text-h4">{p.nombre}</span>
            <span className="text-ink-2"> para {p.vacante.puesto}</span>
          </p>
          <p className="cifras mt-1 text-sm text-ink-2">
            {p.correo}
            {p.telefono && `  ${p.telefono}`}
          </p>
          <p className="mt-1 text-sm text-neutral">
            {p.vacante.company.nombre}
            <span style={{ color: p.vacante.category.colorDark }}> · {p.vacante.category.corto}</span>
          </p>
          {p.mensaje && (
            <p className="mt-2 max-w-[68ch] border-l-rule border-line pl-3 text-sm text-ink-2">
              {p.mensaje}
            </p>
          )}
        </div>

        {!final && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {transicionesDesde(p.estado).map((destino) => (
              <form key={destino} action={cambiarEstadoPostulacion}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="estado" value={destino} />
                <button
                  className={`px-3 py-2 text-sm transition ${
                    destino === 'RECHAZADA' || destino === 'VACANTE_CUBIERTA'
                      ? 'border-px border-line text-ink-2 hover:border-ink'
                      : 'btn-secundario'
                  }`}
                >
                  {ETIQUETA[destino]}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
