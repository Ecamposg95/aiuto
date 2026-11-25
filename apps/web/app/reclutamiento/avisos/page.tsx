import { exigirEmpresaAprobada } from '@/lib/sesion'
import { ListaAvisos } from '@/components/ListaAvisos'

export const dynamic = 'force-dynamic'

export default async function EmpresaAvisos() {
  const { usuario } = await exigirEmpresaAprobada()
  return <ListaAvisos userId={usuario.id} />
}
