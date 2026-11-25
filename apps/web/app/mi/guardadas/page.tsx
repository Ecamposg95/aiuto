import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { formatearSueldo } from '@aiuto/core'
import { exigirCandidato } from '@/lib/sesion'
import { vacantePublica } from '@/lib/consultas'
import { alternarGuardada } from '@/lib/guardadas'

export const dynamic = 'force-dynamic'

export default async function MisGuardadas() {
  const { id: userId } = await exigirCandidato()
  const guardadas = await prisma.vacanteGuardada.findMany({
    where: { perfil: { userId } },
    include: { vacante: { include: { company: true } } },
    orderBy: { creadoEn: 'desc' },
  })
  const abiertas = new Set(
    (await prisma.vacante.findMany({
      where: { id: { in: guardadas.map((g) => g.vacanteId) }, ...vacantePublica() },
      select: { id: true },
    })).map((v) => v.id),
  )

  return (
    <>
      <h1 className="text-h2">Vacantes guardadas</h1>
      {guardadas.length === 0 ? (
        <p className="mt-4 text-ink-2">
          No has guardado ninguna. En cada vacante hay un botón para guardarla y verla después.{' '}
          <Link href="/bolsa" className="text-purple underline">Ver vacantes</Link>
        </p>
      ) : (
        <ul className="mt-6">
          {guardadas.map(({ vacante: v }) => (
            <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 border-t-rule border-ink py-5">
              <div>
                {abiertas.has(v.id) ? (
                  <Link href={`/bolsa/${v.slug}`} className="text-h3 hover:text-purple">{v.puesto}</Link>
                ) : (
                  <p className="text-h3 text-neutral">{v.puesto} <span className="text-sm">(ya no recibe postulaciones)</span></p>
                )}
                <p className="mt-1 text-ink-2">{v.company.nombre}, {v.ubicacion}</p>
                <p className="cifras mt-1">{formatearSueldo(v)}</p>
              </div>
              <form action={alternarGuardada}>
                <input type="hidden" name="vacanteId" value={v.id} />
                <button className="border-px border-line px-3 py-2 text-sm text-ink-2 hover:border-ink">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
