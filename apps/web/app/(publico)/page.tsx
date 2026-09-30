import Link from 'next/link'
import { prisma } from '@aiuto/db'
import {
  formatearSueldo,
  etiquetaModalidad,
  etiquetaSeguroSocial,
  nivelesConPrecio,
  resumirSueldos,
  MUESTRA_MINIMA,
} from '@aiuto/core'
import { vacantePublica } from '@/lib/consultas'

// La portada muestra vacantes reales: tiene que consultarse en cada visita.
export const dynamic = 'force-dynamic'

/** Lo que toda vacante está obligada a declarar. Es la postura del producto. */
const OBLIGATORIOS = [
  'sueldo',
  'porcentaje de seguro social',
  'prestaciones',
  'horario',
  'modalidad',
  'conocimientos requeridos',
  'cuántas entrevistas tiene el proceso',
  'en cuántos días esperan cerrar',
]

export default async function Home() {
  const [recientes, todas, abiertas] = await Promise.all([
    prisma.vacante.findMany({
      where: vacantePublica(),
      include: { company: true, category: true },
      orderBy: { publicadaEn: 'desc' },
      take: 4,
    }),
    prisma.vacante.findMany({
      where: vacantePublica(),
      select: { sueldoMin: true, sueldoMax: true, periodicidad: true },
    }),
    prisma.vacante.count({ where: vacantePublica() }),
  ])

  const sueldos = resumirSueldos(todas)

  return (
    <>
      {/* La portada no promete transparencia: la demuestra con las vacantes de
          hoy y con la cifra que sale de ellas. */}
      <section className="wrap py-8">
        <h1 className="max-w-[16ch] text-display">Aquí sí te dicen cuánto pagan.</h1>

        <p className="mt-6 max-w-[58ch] text-lead text-ink-2">
          En AIUTO una vacante no se puede publicar sin sueldo. Ni sin prestaciones, ni sin
          decir cuántas entrevistas tiene el proceso antes de que lo empieces.
        </p>

        {abiertas > 0 && (
          <p className="cifras mt-6 border-t-rule border-ink pt-4 text-h3">
            {sueldos.suficiente
              ? `${abiertas} vacantes abiertas. La de en medio paga $${sueldos.mediana.toLocaleString('es-MX')} al mes.`
              : `${abiertas} ${abiertas === 1 ? 'vacante abierta' : 'vacantes abiertas'}. Todas con el sueldo publicado.`}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/bolsa" className="btn">
            Ver las vacantes
          </Link>
          <Link href="/sueldos" className="btn-secundario">
            Cuánto se paga por categoría
          </Link>
        </div>
      </section>

      {recientes.length > 0 && (
        <section className="rule bg-off">
          <div className="wrap py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-h2">Lo último que se publicó</h2>
              <Link href="/bolsa" className="text-purple underline">
                Ver todas
              </Link>
            </div>

            <ul className="mt-6">
              {recientes.map((v) => (
                <li
                  key={v.id}
                  className="renglon border-b-line bg-white py-4"
                  style={{ borderLeftColor: v.category.color }}
                >
                  <Link href={`/bolsa/${v.slug}`} className="group block">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
                      <h3 className="text-h3 group-hover:text-purple">{v.puesto}</h3>
                      <p className="cifras text-h4">{formatearSueldo(v)}</p>
                    </div>
                    <p className="mt-1 text-ink-2">
                      {v.company.nombre}, {v.ubicacion} · {etiquetaModalidad(v.modalidad)}
                    </p>
                    <p className="mt-1 text-sm text-ink-2">
                      {etiquetaSeguroSocial(v.seguroSocial, v.seguroSocialPct)} ·{' '}
                      {v.numEntrevistas}{' '}
                      {v.numEntrevistas === 1 ? 'entrevista' : 'entrevistas'} · cierran en{' '}
                      {v.diasCierreEsperado} días
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="wrap py-8">
        <h2 className="max-w-[22ch] text-h1">
          Ninguna otra bolsa te dice todo esto antes de que apliques.
        </h2>
        <p className="mt-5 max-w-[58ch] text-lead text-ink-2">
          Toda vacante publicada aquí declara {OBLIGATORIOS.slice(0, -1).join(', ')} y{' '}
          {OBLIGATORIOS.at(-1)}. No es una recomendación para quien publica: sin esos datos la
          vacante no se guarda.
        </p>
        <p className="mt-5 max-w-[58ch] text-ink-2">
          Y cuando te postulas, te decimos en qué va. Cada vez que cambia algo, te escribimos.
          No tienes que preguntar ni esperar a ciegas.
        </p>
      </section>

      <section className="rule">
        <div className="wrap py-8">
          <h2 className="text-h2">¿Buscas trabajo y no sabes por dónde empezar?</h2>
          <p className="mt-4 max-w-[58ch] text-ink-2">
            La dirección de AIUTO da asesoría de empleabilidad en persona: perfilamiento,
            cuánto vale hoy tu perfil, tu CV reescrito, tu LinkedIn, y acompañamiento hasta que
            te coloques.
          </p>

          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {nivelesConPrecio().map(({ nivel, precio, etiqueta }) => (
              <li key={nivel} className="border-t-rule border-ink pt-4">
                <p className="text-sm text-ink-2">{etiqueta}</p>
                <p className="cifras mt-2 text-h2">
                  {`$${precio.toLocaleString('es-MX')}`}
                  <span className="ml-2 text-sm font-normal text-neutral">MXN</span>
                </p>
              </li>
            ))}
          </ul>

          <Link href="/asesoria" className="btn mt-6">
            Ver qué incluye
          </Link>
        </div>
      </section>
    </>
  )
}
