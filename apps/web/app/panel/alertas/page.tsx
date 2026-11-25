import Link from 'next/link'
import { prisma } from '@aiuto/db'
import { DIAS_HABILES_SIN_CONTACTO } from '@aiuto/core'
import { exigirStaff } from '@/lib/sesion'
import { resolverAlerta } from '@/lib/accionesAdmin'

export const dynamic = 'force-dynamic'

export default async function PanelAlertas() {
  await exigirStaff()
  const alertas = await prisma.alerta.findMany({
    include: {
      vacante: { select: { id: true, puesto: true, slug: true } },
      company: {
        select: { nombre: true, contactoNombre: true, contactoCorreo: true, contactoTel: true, miembros: { include: { user: { select: { email: true, nombre: true } } } } },
      },
      atendidaPor: { select: { nombre: true } },
    },
    orderBy: [{ estado: 'asc' }, { primeraPostulacionEn: 'asc' }],
    take: 200,
  })
  const abiertas = alertas.filter((a) => a.estado === 'ABIERTA')
  const cerradas = alertas.filter((a) => a.estado !== 'ABIERTA')
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })
  const ahora = Date.now()

  return (
    <>
      <h1 className="text-h2">Alertas</h1>
      <p className="mt-3 max-w-[66ch] text-ink-2">
        Vacantes con postulaciones a las que la empresa no ha contactado a nadie en{' '}
        {DIAS_HABILES_SIN_CONTACTO} días hábiles. No significa que perdió el interés: es una
        señal para llamarle y preguntar si el proceso sigue, si necesita ayuda para revisar o si
        hay que cerrar la vacante.
      </p>

      <section className="mt-7">
        <h2 className="text-h3 border-b-rule border-ink pb-2">
          Por atender <span className="cifras text-sm text-neutral">{abiertas.length}</span>
        </h2>
        {abiertas.length === 0 && <p className="mt-4 text-ink-2">Ninguna. Todas las empresas están contactando a sus candidatos.</p>}
        <ul>
          {abiertas.map((a) => {
            const dias = Math.floor((ahora - a.primeraPostulacionEn.getTime()) / 86_400_000)
            const contacto = a.company.miembros[0]?.user
            return (
              <li key={a.id} className="renglon border-l-operaciones py-4">
                <p className="text-h4">{a.company.nombre} · {a.vacante.puesto}</p>
                <p className="cifras mt-1 text-sm text-ink-2">
                  {a.postulados} {a.postulados === 1 ? 'persona postulada' : 'personas postuladas'} · la primera hace {dias} días
                  ({fecha.format(a.primeraPostulacionEn)}) · nadie contactado
                </p>
                <p className="mt-1 text-sm">
                  Contacto: {a.company.contactoNombre ?? contacto?.nombre ?? '—'}{' '}
                  {(a.company.contactoCorreo ?? contacto?.email) && <a className="text-purple underline" href={`mailto:${a.company.contactoCorreo ?? contacto?.email}`}>{a.company.contactoCorreo ?? contacto?.email}</a>}
                  {a.company.contactoTel && <span className="cifras"> · {a.company.contactoTel}</span>}
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <Link href={`/panel/postulaciones?vacante=${a.vacante.id}`} className="border-px border-line px-3 py-2 text-sm text-ink-2 hover:border-ink">
                    Ver postulaciones
                  </Link>
                  <form action={resolverAlerta} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <label className="block">
                      <span className="label block">Qué se habló</span>
                      <input name="nota" maxLength={500} className="campo mt-1" placeholder="Sigue activo, revisan el lunes" />
                    </label>
                    <button name="estado" value="ATENDIDA" className="btn-secundario px-3 py-2 text-sm">Ya hablé con la empresa</button>
                    <button name="estado" value="DESCARTADA" className="border-px border-line px-3 py-2 text-sm text-ink-2 hover:border-ink">Descartar</button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {cerradas.length > 0 && (
        <section className="mt-8">
          <h2 className="text-h3 border-b-rule border-ink pb-2">
            Atendidas <span className="cifras text-sm text-neutral">{cerradas.length}</span>
          </h2>
          <ul>
            {cerradas.map((a) => (
              <li key={a.id} className="border-b-px border-line py-3 text-sm">
                <span className="font-semibold">{a.company.nombre} · {a.vacante.puesto}</span>
                <span className="text-ink-2">
                  {' '}· {a.estado === 'ATENDIDA' ? 'atendida' : 'descartada'}
                  {a.atendidaEn && ` el ${fecha.format(a.atendidaEn)}`}
                  {a.atendidaPor?.nombre && ` por ${a.atendidaPor.nombre}`}
                </span>
                {a.nota && <p className="mt-1 text-ink-2">{a.nota}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
