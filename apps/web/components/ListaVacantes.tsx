import Link from 'next/link'
import type { prisma } from '@aiuto/db'
import { formatearSueldo, diasRestantes, etiquetaModalidad } from '@aiuto/core'
import { publicarVacante, marcarVacanteCubierta, cerrarVacante, ampliarVacante } from '@/lib/acciones'

const ETIQUETA = {
  BORRADOR: 'Borrador',
  ABIERTA: 'Abierta',
  CUBIERTA: 'Cubierta',
  CERRADA: 'Cerrada',
  EXPIRADA: 'Vencida',
} as const

const TONO = {
  BORRADOR: 'estado--espera',
  ABIERTA: 'estado--abierto',
  CUBIERTA: 'estado--cerrado',
  CERRADA: 'estado--cerrado',
  EXPIRADA: 'estado--cerrado',
} as const

/**
 * Las vacantes agrupadas por estado. La usan el panel del equipo (todas) y el
 * de empresa (las suyas): `raiz` dice a qué panel llevan las ligas.
 */
export function ListaVacantes({
  vacantes,
  raiz,
  puedeAmpliar = false,
  vacio,
}: {
  vacantes: V[]
  raiz: '/panel' | '/reclutamiento'
  puedeAmpliar?: boolean
  vacio: string
}) {
  const ahora = new Date()
  const abiertas = vacantes.filter((v) => v.estado === 'ABIERTA')
  const borradores = vacantes.filter((v) => v.estado === 'BORRADOR')
  const cerradas = vacantes.filter((v) => !['ABIERTA', 'BORRADOR'].includes(v.estado))
  const r = (v: V) => <Renglon key={v.id} v={v} ahora={ahora} raiz={raiz} puedeAmpliar={puedeAmpliar} />

  if (vacantes.length === 0) {
    return <p className="mt-6 border-t-rule border-ink pt-5 text-ink-2">{vacio}</p>
  }
  return (
    <>
      {borradores.length > 0 && (
        <Grupo titulo="Sin publicar" cuenta={borradores.length}>
          {borradores.map(r)}
        </Grupo>
      )}
      <Grupo titulo="Publicadas" cuenta={abiertas.length}>
        {abiertas.map(r)}
      </Grupo>
      {cerradas.length > 0 && (
        <Grupo titulo="Ya no reciben postulaciones" cuenta={cerradas.length}>
          {cerradas.map(r)}
        </Grupo>
      )}
    </>
  )
}

function Grupo({
  titulo,
  cuenta,
  children,
}: {
  titulo: string
  cuenta: number
  children: React.ReactNode
}) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline gap-3 border-b-rule border-ink pb-2">
        <h2 className="text-h3">{titulo}</h2>
        <span className="cifras text-sm text-neutral">{cuenta}</span>
      </div>
      <ul>{children}</ul>
    </section>
  )
}

export type V = Awaited<ReturnType<typeof prisma.vacante.findMany>>[number] & {
  company: { nombre: string }
  category: { corto: string; color: string; colorDark: string }
  _count: { postulaciones: number }
}

function Renglon({ v, ahora, raiz, puedeAmpliar }: { v: V; ahora: Date; raiz: string; puedeAmpliar: boolean }) {
  const dias = diasRestantes(v.expiraEn, ahora)
  const porVencer = v.estado === 'ABIERTA' && dias !== null && dias <= 7
  const cerrada = !['ABIERTA', 'BORRADOR'].includes(v.estado)

  return (
    <li
      className={`renglon py-3 ${cerrada ? 'opacity-70' : ''}`}
      style={{ borderLeftColor: v.category.color }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`estado ${TONO[v.estado]}`}>{ETIQUETA[v.estado]}</span>
            {porVencer && (
              <span className="cifras text-sm font-semibold text-operaciones">
                {dias === 0 ? 'Vence hoy' : `Quedan ${dias} días`}
              </span>
            )}
            {v._count.postulaciones > 0 && (
              <Link
                href={`${raiz}/postulaciones?vacante=${v.id}`}
                className="cifras text-sm text-purple hover:underline"
              >
                {v._count.postulaciones}{' '}
                {v._count.postulaciones === 1 ? 'postulación' : 'postulaciones'}
              </Link>
            )}
          </div>

          <h3 className="mt-2 text-h4">{v.puesto}</h3>
          <p className="mt-1 text-sm text-ink-2">
            {v.company.nombre} · {v.ubicacion} · {etiquetaModalidad(v.modalidad)}
          </p>
          <p className="cifras mt-1 text-sm text-ink">{formatearSueldo(v)}</p>
          <p className="mt-1 text-sm" style={{ color: v.category.colorDark }}>
            {v.category.corto}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link
            href={`${raiz}/vacantes/${v.id}/editar`}
            className="border-px border-line px-3 py-2 text-sm text-ink-2 transition hover:border-ink"
          >
            Editar
          </Link>
          {v.estado === 'ABIERTA' && (
            <>
              <Link
                href={`/bolsa/${v.slug}`}
                className="border-px border-line px-3 py-2 text-sm text-ink-2 transition hover:border-ink"
              >
                Ver publicada
              </Link>
              <form action={marcarVacanteCubierta}>
                <input type="hidden" name="id" value={v.id} />
                <button className="btn-secundario px-3 py-2 text-sm">Se cubrió</button>
              </form>
              <form action={cerrarVacante}>
                <input type="hidden" name="id" value={v.id} />
                <button className="border-px border-line px-3 py-2 text-sm text-ink-2 transition hover:border-ink">
                  Cerrar sin cubrir
                </button>
              </form>
              {puedeAmpliar && !v.ampliadaEn && (
                <form action={ampliarVacante}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="border-px border-line px-3 py-2 text-sm text-ink-2 transition hover:border-ink">
                    Ampliar a 60 días
                  </button>
                </form>
              )}
            </>
          )}
          {v.estado === 'BORRADOR' && (
            <form action={publicarVacante}>
              <input type="hidden" name="id" value={v.id} />
              <button className="btn px-4 py-2 text-sm">Publicar</button>
            </form>
          )}
        </div>
      </div>
    </li>
  )
}
