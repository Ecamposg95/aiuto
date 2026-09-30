import Link from 'next/link'
import { prisma, type EstadoPostulacion } from '@aiuto/db'
import { formatearSueldo, esEstadoFinal } from '@aiuto/core'
import { exigirCandidato } from '@/lib/sesion'
import { Avance } from './Avance'

export const dynamic = 'force-dynamic'

/** El mismo texto que ve quien consulta por liga: una sola verdad. */
const ESTADOS: Record<EstadoPostulacion, string> = {
  RECIBIDA: 'Todavía no la revisamos. En cuanto lo hagamos, esto cambia.',
  EN_REVISION: 'Alguien de AIUTO ya tiene tu perfil en las manos.',
  ENTREVISTA: 'Nos vamos a poner en contacto contigo para agendarla.',
  CONTRATADA: 'Felicidades. Gracias por confiarnos tu búsqueda.',
  RECHAZADA: 'No avanzamos con tu postulación para esta vacante.',
  VACANTE_CUBIERTA: 'Se quedó con alguien más. Ya no está disponible.',
}

export default async function MisPostulaciones() {
  const { email: correo } = await exigirCandidato()

  const postulaciones = await prisma.postulacion.findMany({
    where: { OR: [{ correo }, { candidato: { user: { email: correo } } }] },
    include: { vacante: { include: { company: true, category: true } } },
    orderBy: { creadoEn: 'desc' },
  })

  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })
  const abiertas = postulaciones.filter((p) => !esEstadoFinal(p.estado))

  if (postulaciones.length === 0) {
    return (
      <>
        <h1 className="text-h2">Todavía no te has postulado</h1>
        <p className="mt-4 max-w-[58ch] text-lead text-ink-2">
          Cuando lo hagas, aquí vas a ver en qué va cada una sin tener que preguntarle a nadie.
        </p>
        <Link href="/bolsa" className="btn mt-6">
          Ver vacantes abiertas
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="text-h2">
        {abiertas.length === 0
          ? 'Ninguna sigue abierta'
          : `${abiertas.length} ${abiertas.length === 1 ? 'sigue abierta' : 'siguen abiertas'}`}
      </h1>
      <p className="mt-3 text-ink-2">
        Te escribimos cada vez que algo cambia. No tienes que estar revisando.
      </p>

      <ul className="mt-7">
        {postulaciones.map((p) => (
          <li
            key={p.id}
            className="border-t-rule border-ink py-6"
            style={{ borderTopColor: esEstadoFinal(p.estado) ? '#d6d3d1' : undefined }}
          >
            <span
              className="px-2 py-1 text-label uppercase"
              style={{
                backgroundColor: p.vacante.category.colorTint,
                color: p.vacante.category.colorDark,
              }}
            >
              {p.vacante.category.corto}
            </span>

            <h2 className="mt-3 text-h3">{p.vacante.puesto}</h2>
            <p className="mt-1 text-ink-2">
              {p.vacante.company.nombre}, {p.vacante.ubicacion}
            </p>
            <p className="cifras mt-1 text-ink-2">{formatearSueldo(p.vacante)}</p>

            <Avance estado={p.estado} />

            <p className="mt-4 max-w-[58ch] text-ink-2">{ESTADOS[p.estado]}</p>
            <p className="cifras mt-3 text-sm text-neutral">
              Te postulaste el {fecha.format(p.creadoEn)}. Última señal el{' '}
              {fecha.format(p.actualizadoEn)}.
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
