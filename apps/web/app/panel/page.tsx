import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { cambiarEstadoSolicitud } from '@/lib/acciones'

export const dynamic = 'force-dynamic'

const ETIQUETA = {
  NUEVA: 'Nueva',
  EN_PROCESO: 'En proceso',
  ATENDIDA: 'Atendida',
  CERRADA: 'Cerrada',
} as const

const SIGUIENTES = {
  NUEVA: ['EN_PROCESO', 'CERRADA'],
  EN_PROCESO: ['ATENDIDA', 'CERRADA'],
  ATENDIDA: ['CERRADA'],
  CERRADA: [],
} as const

export default async function Bandeja() {
  const [solicitudes, sinRevisar, porContactar, abiertas, porVencer] = await Promise.all([
    prisma.solicitud.findMany({
      where: { estado: { in: ['NUEVA', 'EN_PROCESO'] } },
      include: { category: true, responsable: true },
      orderBy: { creadoEn: 'asc' },
      take: 50,
    }),
    prisma.postulacion.count({ where: { estado: 'RECIBIDA' } }),
    prisma.solicitudAsesoria.count({ where: { estado: 'NUEVA' } }),
    prisma.vacante.count({ where: { estado: 'ABIERTA' } }),
    prisma.vacante.count({
      where: {
        estado: 'ABIERTA',
        expiraEn: { lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
  const hoy = new Date()
  const dias = (d: Date) => Math.floor((hoy.getTime() - d.getTime()) / 86400000)

  return (
    <>
      <h1 className="text-h2">Hoy</h1>

      {/* El único momento fuerte del panel: las cifras dicen qué hay que hacer,
          no cómo se llama la tabla de donde salen. */}
      <div className="mt-5 grid border-t-rule border-ink sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          ruta="/panel/postulaciones"
          numero={sinRevisar}
          hacer="esperan que alguien las mire"
          urgente={sinRevisar > 0}
        />
        <Cifra
          ruta="/panel"
          numero={solicitudes.length}
          hacer="mensajes sin cerrar"
          urgente={solicitudes.length > 0}
        />
        <Cifra
          ruta="/panel/asesorias"
          numero={porContactar}
          hacer="asesorías por contactar"
          urgente={porContactar > 0}
        />
        <Cifra
          ruta="/panel/vacantes"
          numero={abiertas}
          hacer={porVencer > 0 ? `abiertas, ${porVencer} vencen pronto` : 'vacantes abiertas'}
        />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-rule border-ink pb-2">
          <h2 className="text-h3">Mensajes sin cerrar</h2>
          <p className="text-sm text-neutral">Los más viejos primero</p>
        </div>

        {solicitudes.length === 0 ? (
          <p className="mt-5 text-ink-2">
            Nada pendiente. Todo lo que entró ya se atendió.
          </p>
        ) : (
          <ul>
            {solicitudes.map((s) => (
              <li
                key={s.id}
                className="renglon py-4"
                style={{ borderLeftColor: s.category?.color ?? '#d6d3d1' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`estado ${s.estado === 'NUEVA' ? 'estado--abierto' : 'estado--espera'}`}
                      >
                        {ETIQUETA[s.estado]}
                      </span>
                      {s.category && (
                        <span className="text-sm" style={{ color: s.category.colorDark }}>
                          {s.category.corto}
                        </span>
                      )}
                      <span className="cifras text-sm text-neutral">
                        {fecha.format(s.creadoEn)}
                        {dias(s.creadoEn) > 2 && ` · lleva ${dias(s.creadoEn)} días`}
                      </span>
                    </div>

                    <h3 className="mt-2 text-h4">
                      {s.nombre}
                      {s.empresa && <span className="font-normal text-ink-2"> de {s.empresa}</span>}
                    </h3>
                    <p className="cifras mt-1 text-sm text-ink-2">
                      {s.correo}
                      {s.telefono && `  ${s.telefono}`}
                    </p>
                    <p className="mt-2 max-w-[68ch] text-sm text-ink-2">{s.mensaje}</p>
                    {s.responsable && (
                      <p className="mt-2 text-sm text-neutral">
                        Lo lleva {s.responsable.nombre ?? s.responsable.email}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {SIGUIENTES[s.estado].map((destino) => (
                      <form key={destino} action={cambiarEstadoSolicitud}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="estado" value={destino} />
                        <button className="btn-secundario px-3 py-2 text-sm">
                          {ETIQUETA[destino]}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function Cifra({
  ruta,
  numero,
  hacer,
  urgente = false,
}: {
  ruta: string
  numero: number
  hacer: string
  urgente?: boolean
}) {
  return (
    <Link
      href={ruta}
      className="group border-b-rule border-ink px-4 py-5 transition hover:bg-off sm:border-r-px sm:border-r-line sm:last:border-r-0"
    >
      <span className={`cifra ${urgente ? 'text-purple' : 'text-ink'}`}>{numero}</span>
      <span className="mt-1 block max-w-[22ch] text-sm text-ink-2">{hacer}</span>
    </Link>
  )
}
