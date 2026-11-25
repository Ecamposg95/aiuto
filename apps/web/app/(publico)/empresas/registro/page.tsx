import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, inicioSegunRol } from '@/auth'
import { FormaRegistroEmpresa } from './FormaRegistroEmpresa'

export const metadata: Metadata = {
  title: 'Registrar empresa',
  description: 'Publica vacantes en la bolsa de AIUTO y contacta directo a quienes se postulan.',
}
export const dynamic = 'force-dynamic'

const COMO_FUNCIONA = [
  ['Registras tu empresa', 'Revisamos que sea una empresa real antes de activarla.'],
  ['Publicas tus vacantes', 'Con sueldo, prestaciones y lo que esperan de la persona. Sin eso no se publica.'],
  ['Hablas directo con los candidatos', 'Ves su perfil, su CV y su pitch, y les escribes desde tu panel.'],
] as const

export default async function RegistroEmpresa() {
  const sesion = await auth()
  if (sesion?.user) redirect(inicioSegunRol(sesion.user.rol))

  return (
    <div className="wrap py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-8">
        <div>
          <h1 className="text-h1">Registrar tu empresa</h1>
          <p className="mt-3 text-ink-2">
            Para publicar vacantes y gestionar a tus candidatos sin intermediarios.
          </p>
          <FormaRegistroEmpresa />
          <p className="mt-5 text-sm text-ink-2">
            ¿Ya tienes cuenta?{' '}
            <Link href="/entrar" className="text-purple underline">Entrar</Link>
          </p>
        </div>
        <aside className="border-t-rule border-ink pt-6 lg:border-l-rule lg:border-t-0 lg:pl-7 lg:pt-0">
          <p className="text-h3">Cómo funciona</p>
          <ol className="mt-6">
            {COMO_FUNCIONA.map(([titulo, texto], i) => (
              <li key={titulo} className="border-t-px border-line py-4">
                <p className="text-h4">
                  <span className="cifras text-purple">{i + 1}.</span> {titulo}
                </p>
                <p className="mt-1 text-ink-2">{texto}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-ink-2">
            La publicación funciona con una licencia empresarial. Te contamos las condiciones al
            aprobar tu cuenta.
          </p>
        </aside>
      </div>
    </div>
  )
}
