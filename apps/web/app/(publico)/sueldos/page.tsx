import Link from 'next/link'
import type { Metadata } from 'next'
import { resumirSueldos, MUESTRA_MINIMA } from '@aiuto/core'
import { sueldosPorCategoria, empresasConVacantes } from '@/lib/consultas'

export const metadata: Metadata = {
  title: 'Cuánto se paga',
  description:
    'Rangos de sueldo por categoría, calculados con lo que las empresas publicaron en sus vacantes.',
}

export const dynamic = 'force-dynamic'

const pesos = (n: number) => `$${n.toLocaleString('es-MX')}`

export default async function Sueldos() {
  const [categorias, empresas] = await Promise.all([
    sueldosPorCategoria(),
    empresasConVacantes(),
  ])

  const filas = categorias
    .map((c) => ({ categoria: c, resumen: resumirSueldos(c.vacantes) }))
    .filter((f) => f.resumen.muestras > 0)
    .sort((a, b) => b.resumen.mediana - a.resumen.mediana)

  const conDatos = filas.filter((f) => f.resumen.suficiente)
  const sinDatos = filas.filter((f) => !f.resumen.suficiente)

  return (
    <div className="wrap py-7">
      <p className="label">Transparencia</p>
      <h1 className="mt-3 max-w-[20ch] text-display">Cuánto se paga, de verdad</h1>
      <p className="mt-5 max-w-[62ch] text-lead text-ink-2">
        Estos números no los reportó nadie de memoria ni salen de una encuesta. Son los sueldos
        que las empresas publicaron en sus vacantes y se comprometieron a pagar.
      </p>

      {filas.length === 0 ? (
        <p className="mt-7 border-t-rule border-ink pt-5 text-ink-2">
          Todavía no hay vacantes abiertas de donde sacar cifras.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="label border-b-rule border-ink pb-2">Por categoría, al mes</h2>

            {conDatos.length === 0 ? (
              <p className="mt-5 text-ink-2">
                {`Ninguna categoría llega todavía a ${MUESTRA_MINIMA} vacantes abiertas, que es el mínimo que nos pusimos para publicar una cifra.`}
              </p>
            ) : (
              <ul className="mt-2">
                {conDatos.map(({ categoria, resumen }) => (
                  <li key={categoria.id} className="border-b-px border-line-soft py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
                      <div>
                        <Link
                          href={`/bolsa?categoria=${categoria.slug}`}
                          className="text-h3 hover:text-purple"
                        >
                          {categoria.nombre}
                        </Link>
                        <p className="mt-1 text-sm text-neutral">
                          {resumen.muestras}{' '}
                          {resumen.muestras === 1 ? 'vacante abierta' : 'vacantes abiertas'}
                        </p>
                      </div>
                      <p className="text-metric">{pesos(resumen.mediana)}</p>
                    </div>

                    {/* La barra ubica la mediana dentro del rango observado. */}
                    <div
                      className="mt-4 h-2 w-full"
                      style={{ backgroundColor: categoria.colorTint }}
                      role="img"
                      aria-label={`De ${pesos(resumen.min)} a ${pesos(resumen.max)}, con la mitad en ${pesos(resumen.mediana)}`}
                    >
                      <div
                        className="h-2"
                        style={{
                          backgroundColor: categoria.color,
                          width: `${Math.max(2, Math.min(100, ((resumen.mediana - resumen.min) / Math.max(1, resumen.max - resumen.min)) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-ink-2">
                      De {pesos(resumen.min)} a {pesos(resumen.max)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sinDatos.length > 0 && (
            <section className="mt-7">
              <h2 className="label border-b-rule border-ink pb-2">Todavía sin cifra</h2>
              <p className="mt-4 max-w-[62ch] text-ink-2">
                {`Estas categorías tienen vacantes abiertas, pero menos de ${MUESTRA_MINIMA}. Preferimos no publicar un número que suene a dato y no lo sea.`}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {sinDatos.map(({ categoria, resumen }) => (
                  <li key={categoria.id} className="border-px border-line px-3 py-2 text-sm">
                    {categoria.corto}{' '}
                    <span className="text-neutral">
                      ({resumen.muestras} {resumen.muestras === 1 ? 'vacante' : 'vacantes'})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {empresas.length > 0 && (
        <section className="mt-8">
          <h2 className="label border-b-rule border-ink pb-2">Empresas que están contratando</h2>
          <ul className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((e) => (
              <li key={e.id} className="border-t-rule border-ink pt-3">
                <Link href={`/empresa/${e.slug}`} className="text-h4 hover:text-purple">
                  {e.nombre}
                </Link>
                <p className="mt-1 text-sm text-ink-2">
                  {e._count.vacantes}{' '}
                  {e._count.vacantes === 1 ? 'vacante abierta' : 'vacantes abiertas'}
                  {e.ubicacion ? ` · ${e.ubicacion}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 max-w-[62ch] border-t-rule border-ink pt-5 text-sm text-ink-2">
        Sólo se cuentan vacantes abiertas y vigentes. Los sueldos por hora, por semana y
        quincenales se convierten a mensuales con la jornada máxima de ley para poder
        compararlos.
      </p>
    </div>
  )
}
