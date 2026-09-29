import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { formatearSueldo, diasRestantes } from '@aiuto/core'
import { publicarVacante, marcarVacanteCubierta } from '@/lib/acciones'

export const dynamic = 'force-dynamic'

const ETIQUETA_ESTADO = {
  BORRADOR: 'Borrador',
  ABIERTA: 'Abierta',
  CUBIERTA: 'Cubierta',
  CERRADA: 'Cerrada',
  EXPIRADA: 'Expirada',
} as const

export default async function PanelVacantes() {
  const vacantes = await prisma.vacante.findMany({
    include: { company: true, category: true, _count: { select: { postulaciones: true } } },
    orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
  })
  const ahora = new Date()

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h2">Vacantes</h1>
        <Link href="/panel/vacantes/nueva" className="btn">
          Nueva vacante
        </Link>
      </div>

      {vacantes.length === 0 ? (
        <p className="mt-6 border-t-rule border-ink pt-5 text-ink-2">
          Todavía no hay ninguna. Captura la primera para que la bolsa deje de estar vacía.
        </p>
      ) : (
        <ul className="mt-6">
          {vacantes.map((v) => {
            const dias = diasRestantes(v.expiraEn, ahora)
            return (
              <li key={v.id} className="border-t-rule border-ink py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-label uppercase text-neutral">
                    {ETIQUETA_ESTADO[v.estado]}
                  </span>
                  <span
                    className="px-2 py-1 text-label uppercase"
                    style={{ backgroundColor: v.category.colorTint, color: v.category.colorDark }}
                  >
                    {v.category.corto}
                  </span>
                  {v.estado === 'ABIERTA' && dias !== null && (
                    <span className={`text-label uppercase ${dias <= 14 ? 'text-operaciones' : 'text-neutral'}`}>
                      {dias === 0 ? 'Vence hoy' : `${dias} días`}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-h3">{v.puesto}</h2>
                <p className="mt-1 text-sm text-ink-2">
                  {v.company.nombre} · {v.ubicacion} · {formatearSueldo(v)}
                </p>
                <p className="mt-1 text-sm text-neutral">
                  {v._count.postulaciones}{' '}
                  {v._count.postulaciones === 1 ? 'postulación' : 'postulaciones'}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  {v.estado === 'ABIERTA' && (
                    <Link href={`/bolsa/${v.slug}`} className="text-sm text-purple underline">
                      Ver publicada
                    </Link>
                  )}
                  {v.estado === 'BORRADOR' && (
                    <form action={publicarVacante}>
                      <input type="hidden" name="id" value={v.id} />
                      <button className="btn px-4 py-2 text-sm">Publicar</button>
                    </form>
                  )}
                  {v.estado === 'ABIERTA' && (
                    <form action={marcarVacanteCubierta}>
                      <input type="hidden" name="id" value={v.id} />
                      <button className="btn-secundario px-4 py-2 text-sm">
                        Marcar cubierta
                      </button>
                    </form>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
