import { prisma } from '@aiuto/db'

export const dynamic = 'force-dynamic'

const NIVEL = {
  ESTUDIANTE: 'Estudiante o recién egresado',
  EXPERIMENTADO: 'Con experiencia',
  GERENCIA: 'Gerencia o dirección',
} as const

const ETIQUETA = {
  NUEVA: 'Sin contactar',
  CONTACTADA: 'Contactada',
  VENDIDA: 'Vendida',
  EN_CURSO: 'En curso',
  COLOCADO: 'Ya se colocó',
  DESCARTADA: 'Descartada',
} as const

const TONO = {
  NUEVA: 'estado--abierto',
  CONTACTADA: 'estado--espera',
  VENDIDA: 'estado--espera',
  EN_CURSO: 'estado--espera',
  COLOCADO: 'estado--cerrado',
  DESCARTADA: 'estado--cerrado',
} as const

export default async function PanelAsesorias() {
  const solicitudes = await prisma.solicitudAsesoria.findMany({
    orderBy: [{ estado: 'asc' }, { creadoEn: 'asc' }],
    take: 200,
  })

  const vendidas = solicitudes.filter((s) => ['VENDIDA', 'EN_CURSO', 'COLOCADO'].includes(s.estado))
  const porVender = vendidas.reduce((t, s) => t + s.precioMostrado, 0)
  const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

  return (
    <>
      <h1 className="text-h2">Asesorías</h1>
      <p className="mt-3 max-w-[64ch] text-ink-2">
        Prospectos del servicio que da la dirección. El cobro va por fuera; aquí sólo se lleva
        el seguimiento.
      </p>

      {solicitudes.length > 0 && (
        <div className="mt-5 grid border-t-rule border-ink sm:grid-cols-3">
          <Dato numero={String(solicitudes.filter((s) => s.estado === 'NUEVA').length)} que="sin contactar" />
          <Dato numero={String(vendidas.length)} que="vendidas o en curso" />
          <Dato numero={`$${porVender.toLocaleString('es-MX')}`} que="comprometidos en MXN" />
        </div>
      )}

      {solicitudes.length === 0 ? (
        <p className="mt-6 border-t-rule border-ink pt-5 text-ink-2">Todavía no hay ninguna.</p>
      ) : (
        <ul className="mt-7 border-t-rule border-ink">
          {solicitudes.map((s) => (
            <li
              key={s.id}
              className={`renglon border-l-purple py-3 ${
                ['COLOCADO', 'DESCARTADA'].includes(s.estado) ? 'opacity-70' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`estado ${TONO[s.estado]}`}>{ETIQUETA[s.estado]}</span>
                    <span className="cifras text-sm text-neutral">{fecha.format(s.creadoEn)}</span>
                  </div>
                  <h3 className="mt-2 text-h4">{s.nombre}</h3>
                  <p className="cifras mt-1 text-sm text-ink-2">
                    {s.correo}
                    {s.telefono && `  ${s.telefono}`}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">{NIVEL[s.nivel]}</p>
                  {s.mensaje && (
                    <p className="mt-2 max-w-[68ch] border-l-rule border-line pl-3 text-sm text-ink-2">
                      {s.mensaje}
                    </p>
                  )}
                </div>
                <p className="cifras shrink-0 text-h2">
                  {`$${s.precioMostrado.toLocaleString('es-MX')}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Dato({ numero, que }: { numero: string; que: string }) {
  return (
    <div className="border-b-rule border-ink px-4 py-5 sm:border-r-px sm:border-r-line sm:last:border-r-0">
      <span className="cifra">{numero}</span>
      <span className="mt-1 block text-sm text-ink-2">{que}</span>
    </div>
  )
}
