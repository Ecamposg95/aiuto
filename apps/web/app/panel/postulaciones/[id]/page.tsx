import { notFound } from 'next/navigation'
import { exigirStaff } from '@/lib/sesion'
import { postulacionDetalle } from '@/lib/consultas'
import { DetallePostulacion } from '@/components/DetallePostulacion'

export const dynamic = 'force-dynamic'

export default async function PanelPostulacion({ params }: { params: Promise<{ id: string }> }) {
  await exigirStaff()
  const { id } = await params
  const p = await postulacionDetalle(id)
  if (!p) notFound()
  return <DetallePostulacion p={p} raiz="/panel" />
}
