import { exigirCandidato } from '@/lib/sesion'
import { ListaAvisos } from '@/components/ListaAvisos'

export const dynamic = 'force-dynamic'

export default async function MisAvisos() {
  const usuario = await exigirCandidato()
  return <ListaAvisos userId={usuario.id} />
}
