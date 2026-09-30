import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@aiuto/db'
import {
  formatearSueldo,
  etiquetaModalidad,
  etiquetaSeguroSocial,
  diasRestantes,
  jobPosting,
  resumirSueldos,
  aMensual,
} from '@aiuto/core'
import { vacantePorSlug, vacantePublica } from '@/lib/consultas'
import { basePublica } from '@/lib/correo'
import { FormaPostulacion } from './FormaPostulacion'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const vacante = await vacantePorSlug(slug)
  if (!vacante) return { title: 'Vacante no encontrada' }
  return {
    title: `${vacante.puesto} en ${vacante.company.nombre}`,
    description: `${formatearSueldo(vacante)}. ${etiquetaSeguroSocial(
      vacante.seguroSocial,
      vacante.seguroSocialPct,
    )}. ${vacante.numEntrevistas} entrevistas en el proceso.`,
  }
}

export default async function DetalleVacante({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vacante = await vacantePorSlug(slug)
  if (!vacante) notFound()

  // Cómo se compara con su categoría. Sólo se puede hacer honestamente porque
  // todas las vacantes publican sueldo: no hay que estimar nada.
  const deLaCategoria = await prisma.vacante.findMany({
    where: { ...vacantePublica(), categoryId: vacante.categoryId },
    select: { sueldoMin: true, sueldoMax: true, periodicidad: true },
  })
  const mercado = resumirSueldos(deLaCategoria)
  const medioDeEsta = Math.round(
    (aMensual(vacante.sueldoMin, vacante.periodicidad) +
      aMensual(vacante.sueldoMax, vacante.periodicidad)) /
      2,
  )

  const dias = diasRestantes(vacante.expiraEn, new Date())

  const estructurado = jobPosting({
    puesto: vacante.puesto,
    descripcion: vacante.descripcion,
    empresa: vacante.company.nombre,
    empresaUrl: `${basePublica()}/empresa/${vacante.company.slug}`,
    ubicacion: vacante.ubicacion,
    modalidad: vacante.modalidad,
    sueldoMin: vacante.sueldoMin,
    sueldoMax: vacante.sueldoMax,
    moneda: vacante.moneda,
    periodicidad: vacante.periodicidad,
    conocimientos: vacante.conocimientos,
    publicadaEn: vacante.publicadaEn ?? vacante.creadoEn,
    expiraEn: vacante.expiraEn,
  })

  const declara = [
    ['Seguro social', etiquetaSeguroSocial(vacante.seguroSocial, vacante.seguroSocialPct)],
    ['Prestaciones', vacante.prestaciones],
    ['Horario', vacante.horario],
    ['Modalidad', etiquetaModalidad(vacante.modalidad)],
    [
      'Entrevistas',
      `${vacante.numEntrevistas} ${vacante.numEntrevistas === 1 ? 'entrevista' : 'entrevistas'} en el proceso`,
    ],
    ['Plazo de cierre', `La empresa espera cerrar en ${vacante.diasCierreEsperado} días`],
  ] as const

  return (
    <div
      className="wrap py-7"
      style={
        {
          '--cat': vacante.category.color,
          '--cat-dark': vacante.category.colorDark,
          '--cat-tint': vacante.category.colorTint,
        } as React.CSSProperties
      }
    >
      <script
        type="application/ld+json"
        // Lo arma jobPosting() desde la base; no viene del usuario.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(estructurado) }}
      />

      <Link href="/bolsa" className="text-sm text-ink-2 transition hover:text-purple">
        ← Todas las vacantes
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={`/bolsa?categoria=${vacante.category.slug}`}
          className="bg-cat-tint px-2 py-1 text-label uppercase text-cat-dark transition hover:underline"
        >
          {vacante.category.corto}
        </Link>
        {dias !== null && (
          <span
            className={`cifras text-sm ${dias <= 14 ? 'font-semibold text-operaciones' : 'text-neutral'}`}
          >
            {dias === 0 ? 'Vence hoy' : `Quedan ${dias} días para postularte`}
          </span>
        )}
      </div>

      <h1 className="mt-4 max-w-[22ch] text-h1">{vacante.puesto}</h1>
      <p className="mt-2 text-lead text-ink-2">
        <Link
          href={`/empresa/${vacante.company.slug}`}
          className="text-ink underline transition hover:text-purple"
        >
          {vacante.company.nombre}
        </Link>
        , {vacante.ubicacion}
      </p>

      <div className="mt-7 grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
        <div className="min-w-0">
          {/* El sueldo va primero y grande: es lo que nadie más publica. */}
          <section className="border-y-rule border-ink py-6">
            <p className="cifras text-metric">{formatearSueldo(vacante)}</p>
            {mercado.suficiente && (
              <p className="mt-3 max-w-[52ch] text-ink-2">
                {medioDeEsta >= mercado.mediana
                  ? `Por arriba de lo que paga su categoría, donde la vacante de en medio ofrece $${mercado.mediana.toLocaleString('es-MX')} al mes.`
                  : `Por debajo de lo que paga su categoría, donde la vacante de en medio ofrece $${mercado.mediana.toLocaleString('es-MX')} al mes.`}{' '}
                <Link href="/sueldos" className="text-purple underline">
                  Ver los rangos
                </Link>
              </p>
            )}
          </section>

          <section className="mt-7">
            <h2 className="text-h3 border-b-rule border-ink pb-2">Lo que declara esta vacante</h2>
            <dl className="mt-1">
              {declara.map(([termino, valor]) => (
                <div key={termino} className="border-b-px border-line-soft py-3 sm:flex sm:gap-5">
                  <dt className="text-h4 sm:w-[11rem] sm:shrink-0">{termino}</dt>
                  <dd className="mt-1 text-ink-2 sm:mt-0">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-7">
            <h2 className="text-h3 border-b-rule border-ink pb-2">Sobre el puesto</h2>
            <p className="mt-4 max-w-[68ch] whitespace-pre-line text-ink-2">
              {vacante.descripcion}
            </p>
          </section>

          <section className="mt-7">
            <h2 className="text-h3 border-b-rule border-ink pb-2">Qué necesitas saber</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {vacante.conocimientos.map((c) => (
                <li key={c} className="border-px border-line px-3 py-1.5 text-sm">
                  {c}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:sticky lg:top-5">
          <FormaPostulacion vacanteSlug={vacante.slug} />
        </div>
      </div>
    </div>
  )
}
