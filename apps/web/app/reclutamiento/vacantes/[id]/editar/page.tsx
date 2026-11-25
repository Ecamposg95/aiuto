import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@aiuto/db'
import { exigirEmpresaAprobada } from '@/lib/sesion'
import { valoresDeVacante } from '@/lib/formularioVacante'
import { FormaVacante } from '../../../../panel/vacantes/nueva/FormaVacante'

export const dynamic = 'force-dynamic'

export default async function EmpresaEditarVacante({ params }: { params: Promise<{ id: string }> }) {
  const { empresa } = await exigirEmpresaAprobada()
  const { id } = await params

  const [vacante, categorias] = await Promise.all([
    // Filtrada por empresa: la de otra se comporta como si no existiera.
    prisma.vacante.findFirst({ where: { id, companyId: empresa.id }, include: { company: true } }),
    prisma.category.findMany({ orderBy: { orden: 'asc' }, select: { id: true, nombre: true } }),
  ])
  if (!vacante) notFound()

  return (
    <>
      <Link href="/reclutamiento/vacantes" className="text-sm text-ink-2 hover:text-purple">← Vacantes</Link>
      <h1 className="mt-3 text-h2">Editar vacante</h1>
      <FormaVacante
        categorias={categorias}
        vacanteId={vacante.id}
        empresaFija={empresa.nombre}
        modoQA={process.env.MODO_QA === '1'}
        valoresIniciales={valoresDeVacante(vacante)}
      />
    </>
  )
}
