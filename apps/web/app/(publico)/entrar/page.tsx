import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@aiuto/db'
import { resumirSueldos } from '@aiuto/core'
import { auth, inicioSegunRol } from '@/auth'
import { vacantePublica } from '@/lib/consultas'
import { FormaEntrar } from './FormaEntrar'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function Entrar() {
  const sesion = await auth()
  if (sesion?.user) redirect(inicioSegunRol(sesion.user.rol))

  const vacantes = await prisma.vacante.findMany({
    where: vacantePublica(),
    select: { sueldoMin: true, sueldoMax: true, periodicidad: true },
  })
  const sueldos = resumirSueldos(vacantes)

  return (
    <div className="wrap py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-12">
        <div>
          <h1 className="text-h1">Entrar</h1>
          <p className="mt-3 text-ink-2">Con tu cuenta ves en qué va cada postulación tuya.</p>

          <FormaEntrar />

          <p className="mt-5 text-sm text-ink-2">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-purple underline">
              Crea una en un minuto
            </Link>
            . Las del equipo AIUTO se crean a mano.
          </p>
        </div>

        {/* En vez de decoración, lo que hay hoy del otro lado de la puerta. */}
        <aside className="border-t-rule border-ink pt-6 lg:border-l-rule lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="text-h3">Mientras tanto, esto es lo que hay abierto</p>

          <dl className="mt-6">
            <div className="border-t-rule border-ink py-4">
              <dd className="cifra">{vacantes.length}</dd>
              <dt className="mt-1 text-ink-2">vacantes abiertas, todas con sueldo publicado</dt>
            </div>
            {sueldos.suficiente && (
              <div className="border-t-px border-line py-4">
                <dd className="cifra">{`$${sueldos.mediana.toLocaleString('es-MX')}`}</dd>
                <dt className="mt-1 text-ink-2">paga la vacante de en medio, al mes</dt>
              </div>
            )}
          </dl>

          <Link href="/bolsa" className="btn-secundario mt-5">
            Verlas sin cuenta
          </Link>
        </aside>
      </div>
    </div>
  )
}
