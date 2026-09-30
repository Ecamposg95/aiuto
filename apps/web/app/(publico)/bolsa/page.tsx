import Link from 'next/link'
import type { Metadata } from 'next'
import { formatearSueldo, etiquetaModalidad, etiquetaSeguroSocial, diasRestantes } from '@aiuto/core'
import { vacantesAbiertas, categoriasConVacantes, type FiltrosBolsa } from '@/lib/consultas'
import { BuscadorBolsa } from './BuscadorBolsa'

export const metadata: Metadata = {
  title: 'Bolsa de trabajo',
  description:
    'Vacantes que declaran sueldo, prestaciones, horario y cuántas entrevistas tiene el proceso.',
}

// Las vacantes cambian y vencen: nada de prerenderizado estático.
export const dynamic = 'force-dynamic'

export default async function Bolsa({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; modalidad?: string; desde?: string }>
}) {
  const params = await searchParams
  const filtros: FiltrosBolsa = {
    categoria: params.categoria,
    q: params.q,
    modalidad: params.modalidad,
    desde: params.desde ? Number.parseInt(params.desde, 10) : undefined,
  }
  const buscando = Boolean(params.q || params.categoria || params.modalidad || params.desde)

  const [vacantes, categorias] = await Promise.all([
    vacantesAbiertas(filtros),
    categoriasConVacantes(filtros),
  ])
  const ahora = new Date()

  return (
    <div className="wrap py-7">
      <p className="label">Bolsa de trabajo</p>
      <h1 className="mt-3 text-h1">
        {vacantes.length === 0
          ? buscando
            ? 'Nada que empate con esa búsqueda'
            : 'Todavía no hay vacantes abiertas'
          : `${vacantes.length} ${vacantes.length === 1 ? 'vacante' : 'vacantes'}`}
      </h1>
      <p className="mt-4 max-w-[62ch] text-lead text-ink-2">
        Todas dicen cuánto pagan, qué prestaciones dan y cuántas entrevistas tiene el proceso
        antes de que lo empieces.
      </p>

      <BuscadorBolsa categorias={categorias} actual={params} />

      {vacantes.length === 0 ? (
        <div className="mt-7 border-t-rule border-ink pt-5">
          {buscando ? (
            <p className="text-ink-2">
              Prueba con menos filtros o con otra palabra.{' '}
              <Link href="/bolsa" className="text-purple underline">
                Ver todas las vacantes
              </Link>
              .
            </p>
          ) : (
            <p className="text-ink-2">
              Estamos armando el inventario con empresas que ya trabajan con nosotros. Si tu
              empresa quiere publicar,{' '}
              <Link href="/contacto" className="text-purple underline">
                escríbenos
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-7">
          {vacantes.map((v) => {
            const dias = diasRestantes(v.expiraEn, ahora)
            return (
              <li key={v.id} className="border-t-rule border-ink">
                <Link href={`/bolsa/${v.slug}`} className="group block py-5 transition hover:bg-off">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <span
                      className="px-2 py-1 text-label uppercase"
                      style={{ backgroundColor: v.category.colorTint, color: v.category.colorDark }}
                    >
                      {v.category.corto}
                    </span>
                    {dias !== null && dias <= 14 && (
                      <span className="text-label uppercase text-operaciones">
                        {dias === 0 ? 'Vence hoy' : `Quedan ${dias} días`}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-h3 group-hover:text-purple">{v.puesto}</h2>
                  <p className="mt-1 text-ink-2">
                    {v.company.nombre} · {v.ubicacion} · {etiquetaModalidad(v.modalidad)}
                  </p>

                  <p className="mt-3 text-h4">{formatearSueldo(v)}</p>

                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
                    <li>{etiquetaSeguroSocial(v.seguroSocial, v.seguroSocialPct)}</li>
                    <li>
                      {v.numEntrevistas}{' '}
                      {v.numEntrevistas === 1 ? 'entrevista' : 'entrevistas'}
                    </li>
                    <li>Cierra en ~{v.diasCierreEsperado} días</li>
                  </ul>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
