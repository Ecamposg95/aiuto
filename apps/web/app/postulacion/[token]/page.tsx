import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma, type EstadoPostulacion } from '@aiuto/db'
import { formatearSueldo } from '@aiuto/core'

export const dynamic = 'force-dynamic'
// La liga es un secreto: que no la indexe nadie.
export const metadata: Metadata = { title: 'Mi postulación', robots: { index: false, follow: false } }

/**
 * El motivo por el que existe AIUTO: aquí se ve qué pasó con tu postulación.
 * Cada estado se dice en palabras de la persona que aplicó, no en jerga interna.
 */
const ESTADOS: Record<EstadoPostulacion, { titulo: string; explicacion: string; final: boolean }> = {
  RECIBIDA: {
    titulo: 'Recibimos tu postulación',
    explicacion: 'Todavía no la revisamos. En cuanto lo hagamos, esto cambia.',
    final: false,
  },
  EN_REVISION: {
    titulo: 'Estamos revisando tu perfil',
    explicacion: 'Alguien de AIUTO ya lo tiene en las manos.',
    final: false,
  },
  ENTREVISTA: {
    titulo: 'Pasaste a entrevista',
    explicacion: 'Nos vamos a poner en contacto contigo para agendarla.',
    final: false,
  },
  CONTRATADA: {
    titulo: 'Te contrataron',
    explicacion: 'Felicidades. Gracias por confiarnos tu búsqueda.',
    final: true,
  },
  RECHAZADA: {
    titulo: 'Esta vez no se dio',
    explicacion:
      'No seguimos adelante con tu postulación para esta vacante. Preferimos decírtelo a dejarte esperando.',
    final: true,
  },
  VACANTE_CUBIERTA: {
    titulo: 'La vacante se cubrió con alguien más',
    explicacion: 'Ya no está disponible. Gracias por el tiempo que le dedicaste.',
    final: true,
  },
}

export default async function PaginaPostulacion({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const postulacion = await prisma.postulacion.findUnique({
    where: { tokenConsulta: token },
    include: { vacante: { include: { company: true } } },
  })
  if (!postulacion) notFound()

  const estado = ESTADOS[postulacion.estado]
  const formato = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' })

  return (
    <div className="wrap max-w-[70ch] py-7">
      <p className="label">Tu postulación</p>
      <h1 className="mt-3 text-h1">{postulacion.vacante.puesto}</h1>
      <p className="mt-2 text-lead text-ink-2">
        {postulacion.vacante.company.nombre} · {postulacion.vacante.ubicacion}
      </p>

      <div className={`mt-6 border-rule p-5 ${estado.final ? 'border-line bg-off' : 'border-ink'}`}>
        <h2 className="text-h2">{estado.titulo}</h2>
        <p className="mt-3 text-ink-2">{estado.explicacion}</p>
        <p className="mt-5 text-sm text-neutral">
          Última actualización: {formato.format(postulacion.actualizadoEn)}
        </p>
      </div>

      <dl className="mt-7 border-t-rule border-ink">
        <Dato termino="Te postulaste el" valor={formato.format(postulacion.creadoEn)} />
        <Dato termino="A nombre de" valor={postulacion.nombre} />
        <Dato termino="Correo" valor={postulacion.correo} />
        <Dato termino="Sueldo publicado" valor={formatearSueldo(postulacion.vacante)} />
      </dl>

      <p className="mt-7 text-sm text-ink-2">
        Guarda esta liga: es la forma de volver a consultar tu postulación sin tener que
        escribirle a nadie.{' '}
        <Link href="/bolsa" className="text-purple underline">
          Ver otras vacantes
        </Link>
      </p>
    </div>
  )
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="border-b-px border-line-soft py-3 sm:flex sm:gap-5">
      <dt className="text-h4 sm:w-[12rem] sm:shrink-0">{termino}</dt>
      <dd className="mt-1 text-ink-2 sm:mt-0">{valor}</dd>
    </div>
  )
}
