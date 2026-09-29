import { prisma } from '@aiuto/db'

export const dynamic = 'force-dynamic'

const NIVEL = {
  ESTUDIANTE: 'Estudiante o recién egresado',
  EXPERIMENTADO: 'Persona con experiencia',
  GERENCIA: 'Gerencia o dirección',
} as const

export default async function PanelAsesorias() {
  const solicitudes = await prisma.solicitudAsesoria.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 200,
  })
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' })

  return (
    <>
      <h1 className="text-h2">Asesorías de empleabilidad</h1>
      <p className="mt-3 max-w-[62ch] text-sm text-ink-2">
        Prospectos. El cobro va por fuera del sistema: aquí sólo se lleva el seguimiento.
      </p>

      {solicitudes.length === 0 ? (
        <p className="mt-6 border-t-rule border-ink pt-5 text-ink-2">Todavía no hay ninguna.</p>
      ) : (
        <ul className="mt-6">
          {solicitudes.map((s) => (
            <li key={s.id} className="border-t-rule border-ink py-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-label uppercase text-neutral">{s.estado}</span>
                <span className="text-sm text-neutral">{fecha.format(s.creadoEn)}</span>
              </div>
              <h2 className="mt-2 text-h3">{s.nombre}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {s.correo}
                {s.telefono ? ` · ${s.telefono}` : ''}
              </p>
              <p className="mt-2 text-h4">
                {NIVEL[s.nivel]} · ${s.precioMostrado.toLocaleString('es-MX')} {s.moneda}
              </p>
              {s.mensaje && (
                <p className="mt-3 border-l-rule border-line pl-4 text-sm text-ink-2">{s.mensaje}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
