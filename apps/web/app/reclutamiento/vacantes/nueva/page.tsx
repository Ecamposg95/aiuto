import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { exigirEmpresaAprobada } from '@/lib/sesion'
import { FormaVacante } from '../../../panel/vacantes/nueva/FormaVacante'

export const dynamic = 'force-dynamic'

export default async function EmpresaNuevaVacante() {
  const { empresa } = await exigirEmpresaAprobada()
  const categorias = await prisma.category.findMany({ orderBy: { orden: 'asc' }, select: { id: true, nombre: true } })

  return (
    <>
      <Link href="/reclutamiento/vacantes" className="text-sm text-ink-2 hover:text-purple">← Vacantes</Link>
      <h1 className="mt-3 text-h2">Publicar una vacante</h1>
      <p className="mt-2 max-w-[60ch] text-ink-2">
        Clara y concreta: lo que se va a hacer, lo que se paga y lo indispensable. Las vacantes
        largas y ambiguas reciben menos postulaciones, no más.
      </p>
      <FormaVacante categorias={categorias} empresaFija={empresa.nombre} modoQA={process.env.MODO_QA === '1'} />
    </>
  )
}
