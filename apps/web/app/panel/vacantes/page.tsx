import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { ListaVacantes } from '@/components/ListaVacantes'

export const dynamic = 'force-dynamic'

export default async function PanelVacantes() {
  const vacantes = await prisma.vacante.findMany({
    include: { company: true, category: true, _count: { select: { postulaciones: true } } },
    orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h2">Vacantes</h1>
        <Link href="/panel/vacantes/nueva" className="btn">
          Capturar una vacante
        </Link>
      </div>
      <ListaVacantes
        vacantes={vacantes}
        raiz="/panel"
        puedeAmpliar
        vacio="Todavía no hay ninguna. Captura la primera para que la bolsa deje de estar vacía."
      />
    </>
  )
}
