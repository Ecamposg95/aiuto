import Link from 'next/link'
import { prisma } from '@aiuto/db'

/**
 * Los avisos de una cuenta. Al abrir la lista se marcan como leídos: quien
 * entró aquí ya los vio.
 */
export async function ListaAvisos({ userId }: { userId: string }) {
  const avisos = await prisma.notificacion.findMany({
    where: { userId },
    orderBy: { creadoEn: 'desc' },
    take: 100,
  })
  await prisma.notificacion.updateMany({ where: { userId, leidaEn: null }, data: { leidaEn: new Date() } })
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <>
      <h1 className="text-h2">Avisos</h1>
      {avisos.length === 0 ? (
        <p className="mt-6 text-ink-2">No tienes avisos todavía.</p>
      ) : (
        <ul className="mt-6">
          {avisos.map((a) => (
            <li key={a.id} className={`border-t-px border-line py-4 ${a.leidaEn ? '' : 'font-semibold'}`}>
              {a.liga ? (
                <Link href={a.liga} className="hover:text-purple hover:underline">{a.titulo}</Link>
              ) : (
                a.titulo
              )}
              {a.cuerpo && <p className="mt-1 text-sm font-normal text-ink-2">{a.cuerpo}</p>}
              <p className="cifras mt-1 text-sm font-normal text-neutral">{fecha.format(a.creadoEn)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
