import { exigirStaff } from '@/lib/sesion'
import { ListaAvisos } from '@/components/ListaAvisos'

export const dynamic = 'force-dynamic'

export default async function PanelAvisos() {
  const usuario = await exigirStaff()
  return <ListaAvisos userId={usuario.id} />
}
