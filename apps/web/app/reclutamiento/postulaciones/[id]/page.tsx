import { notFound } from 'next/navigation'
import { exigirEmpresaAprobada } from '@/lib/sesion'
import { postulacionDetalle } from '@/lib/consultas'
import { marcarLeidos } from '@/lib/notificaciones'
import { DetallePostulacion } from '@/components/DetallePostulacion'

export const dynamic = 'force-dynamic'

export default async function EmpresaPostulacion({ params }: { params: Promise<{ id: string }> }) {
  const { empresa } = await exigirEmpresaAprobada()
  const { id } = await params
  const p = await postulacionDetalle(id)
  // La de otra empresa se comporta como si no existiera.
  if (!p || p.vacante.companyId !== empresa.id) notFound()
  await marcarLeidos(p.id, 'empresa')
  return <DetallePostulacion p={p} raiz="/reclutamiento" />
}
