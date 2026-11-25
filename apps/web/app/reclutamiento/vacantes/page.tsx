import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { exigirEmpresaAprobada } from '@/lib/sesion'
import { ListaVacantes } from '@/components/ListaVacantes'

export const dynamic = 'force-dynamic'

export default async function EmpresaVacantes() {
  const { empresa } = await exigirEmpresaAprobada()
  const vacantes = await prisma.vacante.findMany({
    where: { companyId: empresa.id },
    include: { company: true, category: true, _count: { select: { postulaciones: true } } },
    orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h2">Vacantes</h1>
        <Link href="/reclutamiento/vacantes/nueva" className="btn">Publicar una vacante</Link>
      </div>
      <p className="mt-3 max-w-[64ch] text-sm text-ink-2">
        Cada vacante vive 30 días. Si necesitas más tiempo, pídele a AIUTO que la amplíe a 60.
      </p>
      <ListaVacantes vacantes={vacantes} raiz="/reclutamiento" vacio="Todavía no tienes vacantes. Publica la primera." />
    </>
  )
}
