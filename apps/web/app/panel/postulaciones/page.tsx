import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { ListaPostulaciones } from '@/components/ListaPostulaciones'

export const dynamic = 'force-dynamic'

export default async function PanelPostulaciones({
  searchParams,
}: {
  searchParams: Promise<{ vacante?: string }>
}) {
  const { vacante } = await searchParams
  const postulaciones = await prisma.postulacion.findMany({
    where: vacante ? { vacanteId: vacante } : undefined,
    include: {
      vacante: { include: { company: true, category: true } },
      _count: { select: { mensajes: { where: { leidoEn: null, deEmpresa: false } } } },
    },
    // Lo que nadie ha mirado, primero; después lo más viejo.
    orderBy: [{ estado: 'asc' }, { creadoEn: 'asc' }],
    take: 200,
  })

  return (
    <>
      <h1 className="text-h2">Postulaciones</h1>
      <p className="mt-3 max-w-[64ch] text-ink-2">
        Mover una postulación aquí le llega a la persona. No es un trámite interno: es
        responderle a alguien que está esperando.
      </p>
      {vacante && (
        <Link href="/panel/postulaciones" className="mt-3 inline-block text-sm text-purple underline">
          Ver todas las vacantes
        </Link>
      )}
      <ListaPostulaciones postulaciones={postulaciones} raiz="/panel" />
    </>
  )
}
