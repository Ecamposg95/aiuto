import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  formatearSueldo,
  etiquetaModalidad,
  etiquetaSeguroSocial,
  resumirSueldos,
  MUESTRA_MINIMA,
} from '@aiuto/core'
import { empresaPorSlug } from '@/lib/consultas'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const empresa = await empresaPorSlug(slug)
  if (!empresa) return { title: 'Empresa no encontrada' }
  return {
    title: `Vacantes en ${empresa.nombre}`,
    description: `${empresa.vacantes.length} vacantes abiertas, todas con sueldo y prestaciones a la vista.`,
  }
}

const pesos = (n: number) => `$${n.toLocaleString('es-MX')}`

export default async function Empresa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const empresa = await empresaPorSlug(slug)
  if (!empresa) notFound()

  const resumen = resumirSueldos(empresa.vacantes)

  return (
    <div className="wrap py-7">
      <Link href="/bolsa" className="text-sm text-ink-2 hover:text-purple">
        ← Todas las vacantes
      </Link>

      <p className="label mt-5">Empresa</p>
      <h1 className="mt-3 text-h1">{empresa.nombre}</h1>
      {empresa.ubicacion && <p className="mt-2 text-lead text-ink-2">{empresa.ubicacion}</p>}

      {/* Lo que esta empresa paga, según lo que ella misma publicó. */}
      <section className="mt-7 border-rule border-ink p-5">
        <h2 className="label">Lo que paga esta empresa</h2>
        {resumen.suficiente ? (
          <>
            <p className="mt-4 text-metric">{pesos(resumen.mediana)}</p>
            <p className="mt-1 text-ink-2">
              {`es el sueldo de en medio de sus ${resumen.muestras} vacantes abiertas, al mes`}
            </p>
            <p className="mt-3 text-sm text-ink-2">
              {`Van de ${pesos(resumen.min)} a ${pesos(resumen.max)}. No son estimaciones: son las cifras que la empresa publicó y se comprometió a pagar.`}
            </p>
          </>
        ) : (
          <p className="mt-4 text-ink-2">
            {empresa.vacantes.length === 0
              ? 'No tiene vacantes abiertas ahora mismo.'
              : `Con ${empresa.vacantes.length} ${empresa.vacantes.length === 1 ? 'vacante abierta' : 'vacantes abiertas'} no alcanza para hablar de un sueldo típico. Hacen falta al menos ${MUESTRA_MINIMA}.`}
          </p>
        )}
      </section>

      {empresa.vacantes.length > 0 && (
        <section className="mt-7">
          <h2 className="label border-b-rule border-ink pb-2">
            {empresa.vacantes.length}{' '}
            {empresa.vacantes.length === 1 ? 'vacante abierta' : 'vacantes abiertas'}
          </h2>
          <ul>
            {empresa.vacantes.map((v) => (
              <li key={v.id} className="border-b-px border-line-soft">
                <Link href={`/bolsa/${v.slug}`} className="group block py-5 transition hover:bg-off">
                  <span
                    className="px-2 py-1 text-label uppercase"
                    style={{ backgroundColor: v.category.colorTint, color: v.category.colorDark }}
                  >
                    {v.category.corto}
                  </span>
                  <h3 className="mt-3 text-h3 group-hover:text-purple">{v.puesto}</h3>
                  <p className="mt-1 text-ink-2">
                    {v.ubicacion} · {etiquetaModalidad(v.modalidad)}
                  </p>
                  <p className="mt-2 text-h4">{formatearSueldo(v)}</p>
                  <p className="mt-1 text-sm text-ink-2">
                    {etiquetaSeguroSocial(v.seguroSocial, v.seguroSocialPct)} ·{' '}
                    {v.numEntrevistas} {v.numEntrevistas === 1 ? 'entrevista' : 'entrevistas'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
