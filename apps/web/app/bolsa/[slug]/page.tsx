import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  formatearSueldo,
  etiquetaModalidad,
  etiquetaSeguroSocial,
  diasRestantes,
} from '@aiuto/core'
import { vacantePorSlug } from '@/lib/consultas'
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
    )}. ${vacante.numEntrevistas} entrevistas.`,
  }
}

export default async function DetalleVacante({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vacante = await vacantePorSlug(slug)
  if (!vacante) notFound()

  const dias = diasRestantes(vacante.expiraEn, new Date())

  // Lo que ninguna otra bolsa obliga a publicar. Va primero, no en letras chicas.
  const transparencia = [
    ['Sueldo', formatearSueldo(vacante)],
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
      <Link href="/bolsa" className="text-sm text-ink-2 hover:text-purple">
        ← Todas las vacantes
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="bg-cat-tint px-2 py-1 text-label uppercase text-cat-dark">
          {vacante.category.corto}
        </span>
        {dias !== null && (
          <span className={`text-label uppercase ${dias <= 14 ? 'text-operaciones' : 'text-neutral'}`}>
            {dias === 0 ? 'Vence hoy' : `Quedan ${dias} días`}
          </span>
        )}
      </div>

      <h1 className="mt-4 text-h1">{vacante.puesto}</h1>
      <p className="mt-2 text-lead text-ink-2">
        <Link href={`/empresa/${vacante.company.slug}`} className="text-ink underline hover:text-purple">
          {vacante.company.nombre}
        </Link>{' '}
        · {vacante.ubicacion}
      </p>

      <div className="mt-7 grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
        <div>
          <section>
            <h2 className="label border-b-rule border-ink pb-2">Lo que declara esta vacante</h2>
            <dl className="mt-4">
              {transparencia.map(([termino, valor]) => (
                <div key={termino} className="border-b-px border-line-soft py-3 sm:flex sm:gap-5">
                  <dt className="text-h4 sm:w-[11rem] sm:shrink-0">{termino}</dt>
                  <dd className="mt-1 text-ink-2 sm:mt-0">{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-7">
            <h2 className="label border-b-rule border-ink pb-2">Sobre el puesto</h2>
            <p className="mt-4 whitespace-pre-line text-ink-2">{vacante.descripcion}</p>
          </section>

          <section className="mt-7">
            <h2 className="label border-b-rule border-ink pb-2">Conocimientos requeridos</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {vacante.conocimientos.map((c) => (
                <li key={c} className="border-px border-line px-3 py-1 text-sm">
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
