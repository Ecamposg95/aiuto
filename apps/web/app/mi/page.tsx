import Link from 'next/link'
import { exigirCandidato } from '@/lib/sesion'
import { prisma, type EstadoPostulacion } from '@aiuto/db'
import { formatearSueldo } from '@aiuto/core'

export const dynamic = 'force-dynamic'

/** El mismo texto que ve quien consulta por liga: una sola verdad. */
const ESTADOS: Record<EstadoPostulacion, { titulo: string; explicacion: string; final: boolean }> = {
  RECIBIDA: {
    titulo: 'Recibida',
    explicacion: 'Todavía no la revisamos. En cuanto lo hagamos, esto cambia.',
    final: false,
  },
  EN_REVISION: {
    titulo: 'En revisión',
    explicacion: 'Alguien de AIUTO ya tiene tu perfil en las manos.',
    final: false,
  },
  ENTREVISTA: {
    titulo: 'En entrevista',
    explicacion: 'Nos vamos a poner en contacto contigo para agendarla.',
    final: false,
  },
  CONTRATADA: { titulo: 'Contratada', explicacion: 'Felicidades.', final: true },
  RECHAZADA: {
    titulo: 'No siguió',
    explicacion: 'No avanzamos con tu postulación para esta vacante.',
    final: true,
  },
  VACANTE_CUBIERTA: {
    titulo: 'La vacante se cubrió',
    explicacion: 'Se quedó con alguien más. Ya no está disponible.',
    final: true,
  },
}

export default async function MisPostulaciones() {
  const { email: correo } = await exigirCandidato()

  // Se buscan por perfil y tambien por correo: quien se postulo antes de tener
  // cuenta no deberia perder su historial por eso.
  const postulaciones = await prisma.postulacion.findMany({
    where: { OR: [{ correo }, { candidato: { user: { email: correo } } }] },
    include: { vacante: { include: { company: true } } },
    orderBy: { creadoEn: 'desc' },
  })

  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })
  const abiertas = postulaciones.filter((p) => !ESTADOS[p.estado].final)

  return (
    <>
      <h1 className="text-h2">Mis postulaciones</h1>

      {postulaciones.length === 0 ? (
        <div className="mt-6 border-t-rule border-ink pt-5">
          <p className="text-ink-2">Todavía no te has postulado a nada.</p>
          <Link href="/bolsa" className="btn mt-5">
            Ver vacantes
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-3 text-ink-2">
            {abiertas.length === 0
              ? 'Ninguna sigue abierta en este momento.'
              : `${abiertas.length} ${abiertas.length === 1 ? 'sigue abierta' : 'siguen abiertas'}.`}
          </p>

          <ul className="mt-6">
            {postulaciones.map((p) => {
              const estado = ESTADOS[p.estado]
              return (
                <li key={p.id} className="border-t-rule border-ink py-5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span
                      className={`text-label uppercase ${estado.final ? 'text-neutral' : 'text-purple'}`}
                    >
                      {estado.titulo}
                    </span>
                    <span className="text-sm text-neutral">
                      Te postulaste el {fecha.format(p.creadoEn)}
                    </span>
                  </div>

                  <h2 className="mt-2 text-h3">{p.vacante.puesto}</h2>
                  <p className="mt-1 text-ink-2">
                    {p.vacante.company.nombre} · {p.vacante.ubicacion}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">{formatearSueldo(p.vacante)}</p>

                  <p className="mt-3 text-sm text-ink-2">{estado.explicacion}</p>
                  <p className="mt-2 text-sm text-neutral">
                    Última actualización: {fecha.format(p.actualizadoEn)}
                  </p>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}
