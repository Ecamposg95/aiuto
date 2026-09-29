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
  const [solicitudes, conteos] = await Promise.all([
    prisma.solicitud.findMany({
      where: { estado: { in: ['NUEVA', 'EN_PROCESO'] } },
      include: { category: true, responsable: true },
      orderBy: { creadoEn: 'desc' },
      take: 100,
    }),
    Promise.all([
      prisma.vacante.count({ where: { estado: 'ABIERTA' } }),
      prisma.postulacion.count({ where: { estado: 'RECIBIDA' } }),
      prisma.solicitudAsesoria.count({ where: { estado: 'NUEVA' } }),
    ]),
  ])

  const [vacantesAbiertas, postulacionesNuevas, asesoriasNuevas] = conteos
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

  return (
    <>
      <h1 className="text-h2">Bandeja</h1>

      <ul className="mt-5 grid gap-4 sm:grid-cols-3">
        <Tarjeta ruta="/panel/vacantes" numero={vacantesAbiertas} etiqueta="Vacantes abiertas" />
        <Tarjeta
          ruta="/panel/postulaciones"
          numero={postulacionesNuevas}
          etiqueta="Postulaciones sin revisar"
        />
        <Tarjeta ruta="/panel/asesorias" numero={asesoriasNuevas} etiqueta="Asesorías por contactar" />
      </ul>

      <h2 className="mt-7 label border-b-rule border-ink pb-2">Solicitudes abiertas</h2>

      {solicitudes.length === 0 ? (
        <p className="mt-5 text-ink-2">Nada pendiente. Todo lo que entró ya se atendió.</p>
      ) : (
        <ul className="mt-2">
          {solicitudes.map((s) => (
            <li key={s.id} className="border-b-px border-line-soft py-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-label uppercase text-neutral">{ETIQUETA[s.estado]}</span>
                {s.category && (
                  <span
                    className="px-2 py-1 text-label uppercase"
                    style={{ backgroundColor: s.category.colorTint, color: s.category.colorDark }}
                  >
                    {s.category.corto}
                  </span>
                )}
                <span className="text-sm text-neutral">{fecha.format(s.creadoEn)}</span>
              </div>

              <h3 className="mt-2 text-h4">
                {s.nombre}
                {s.empresa ? ` · ${s.empresa}` : ''}
              </h3>
              <p className="mt-1 text-sm text-ink-2">
                {s.correo}
                {s.telefono ? ` · ${s.telefono}` : ''} · desde {s.origen}
              </p>
              <p className="mt-3 border-l-rule border-line pl-4 text-sm text-ink-2">{s.mensaje}</p>
              {s.responsable && (
                <p className="mt-2 text-sm text-neutral">
                  A cargo de {s.responsable.nombre ?? s.responsable.email}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {SIGUIENTES[s.estado].map((destino) => (
                  <form key={destino} action={cambiarEstadoSolicitud}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="estado" value={destino} />
                    <button className="btn-secundario px-3 py-2 text-sm">{ETIQUETA[destino]}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Tarjeta({ ruta, numero, etiqueta }: { ruta: string; numero: number; etiqueta: string }) {
  return (
    <li className="border-rule border-ink">
      <Link href={ruta} className="block p-4 transition hover:bg-off">
        <p className="text-metric">{numero}</p>
        <p className="mt-1 text-sm text-ink-2">{etiqueta}</p>
      </Link>
    </li>
  )
}
