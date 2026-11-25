import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@aiuto/db'
import { formatearSueldo, esEstadoFinal } from '@aiuto/core'
import { exigirCandidato } from '@/lib/sesion'
import { marcarLeidos } from '@/lib/notificaciones'
import { Conversacion } from '@/components/Conversacion'
import { Avance } from '../../Avance'

export const dynamic = 'force-dynamic'

/** Una postulación propia, con la conversación con la empresa. */
export default async function MiPostulacion({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await exigirCandidato()
  const { id } = await params

  const p = await prisma.postulacion.findFirst({
    // Sólo las ligadas a su perfil: la conversación es con la cuenta.
    where: { id, candidato: { userId } },
    include: {
      vacante: { include: { company: true } },
      mensajes: { orderBy: { creadoEn: 'asc' }, include: { autor: { select: { nombre: true } } } },
    },
  })
  if (!p) notFound()
  await marcarLeidos(p.id, 'candidato')

  return (
    <>
      <Link href="/mi" className="text-sm text-ink-2 hover:text-purple">← Mis postulaciones</Link>
      <h1 className="mt-3 text-h2">{p.vacante.puesto}</h1>
      <p className="mt-1 text-ink-2">
        {p.vacante.company.nombre}, {p.vacante.ubicacion} · <span className="cifras">{formatearSueldo(p.vacante)}</span>
      </p>
      <Avance estado={p.estado} />
      <Conversacion
        postulacionId={p.id}
        mensajes={p.mensajes}
        yoSoyEmpresa={false}
        nombreEmpresa={p.vacante.company.nombre}
        // Se puede contestar mientras el proceso siga abierto y la empresa ya haya escrito.
        puedeEscribir={!esEstadoFinal(p.estado) && p.mensajes.some((m) => m.deEmpresa)}
      />
      {!p.mensajes.some((m) => m.deEmpresa) && (
        <p className="mt-3 text-sm text-ink-2">
          Cuando la empresa te escriba, podrás contestarle aquí. Te avisamos por correo.
        </p>
      )}
    </>
  )
}
