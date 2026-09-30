import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, inicioSegunRol } from '@/auth'
import { FormaRegistro } from './FormaRegistro'

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta para seguir tus postulaciones sin preguntarle a nadie.',
}
export const dynamic = 'force-dynamic'

/** Lo que cambia por tener cuenta. Escrito como lo diría quien busca trabajo. */
const SIRVE_PARA = [
  [
    'Saber en qué va cada postulación',
    'Sin escribirle a nadie ni quedarte esperando a ciegas.',
  ],
  [
    'Enterarte cuando algo cambia',
    'Te escribimos en cada paso, también cuando la respuesta es no.',
  ],
  [
    'Recuperar lo que ya hiciste',
    'Si te postulaste antes con este mismo correo, tu historial aparece solo.',
  ],
] as const

export default async function Registro() {
  const sesion = await auth()
  if (sesion?.user) redirect(inicioSegunRol(sesion.user.rol))

  return (
    <div className="wrap py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-12">
        <div>
          <h1 className="text-h1">Crear cuenta</h1>
          <p className="mt-3 text-ink-2">Toma un minuto y no pedimos nada más que esto.</p>

          <FormaRegistro />

          <p className="mt-5 text-sm text-ink-2">
            ¿Ya tienes una?{' '}
            <Link href="/entrar" className="text-purple underline">
              Entra aquí
            </Link>
            . Al registrarte aceptas el{' '}
            <Link href="/privacidad" className="text-purple underline">
              aviso de privacidad
            </Link>
            .
          </p>
        </div>

        <aside className="border-t-rule border-ink pt-6 lg:border-l-rule lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="text-h3">Para qué te sirve</p>
          <dl className="mt-6">
            {SIRVE_PARA.map(([que, detalle]) => (
              <div key={que} className="border-t-px border-line py-4 first:border-t-rule first:border-ink">
                <dt className="text-h4">{que}</dt>
                <dd className="mt-1 max-w-[46ch] text-ink-2">{detalle}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 max-w-[46ch] text-sm text-ink-2">
            No necesitas cuenta para postularte. La cuenta sirve para no perder el hilo cuando
            son varias.
          </p>
        </aside>
      </div>
    </div>
  )
}
