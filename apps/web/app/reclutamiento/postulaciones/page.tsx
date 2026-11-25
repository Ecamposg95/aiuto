import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { exigirEmpresaAprobada } from '@/lib/sesion'
import { ListaPostulaciones } from '@/components/ListaPostulaciones'

export const dynamic = 'force-dynamic'

export default async function EmpresaPostulaciones({
  searchParams,
}: {
  searchParams: Promise<{ vacante?: string }>
}) {
  const { empresa } = await exigirEmpresaAprobada()
  const { vacante } = await searchParams

  const postulaciones = await prisma.postulacion.findMany({
    // Siempre acotado a la empresa; el filtro por vacante va además, no en lugar.
    where: { vacante: { companyId: empresa.id }, ...(vacante ? { vacanteId: vacante } : {}) },
    include: {
      vacante: { include: { company: true, category: true } },
      _count: { select: { mensajes: { where: { leidoEn: null, deEmpresa: false } } } },
    },
    orderBy: [{ estado: 'asc' }, { creadoEn: 'asc' }],
    take: 300,
  })

  return (
    <>
      <h1 className="text-h2">Postulaciones</h1>
      <p className="mt-3 max-w-[64ch] text-ink-2">
        Escríbele a quien te interese desde su ficha. Cada cambio de estado le llega a la persona.
      </p>
      {vacante && (
        <Link href="/reclutamiento/postulaciones" className="mt-3 inline-block text-sm text-purple underline">
          Ver todas las vacantes
        </Link>
      )}
      <ListaPostulaciones postulaciones={postulaciones} raiz="/reclutamiento" />
    </>
  )
}
