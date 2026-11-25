import { FormaMensaje } from './FormaMensaje'

type Mensaje = {
  id: string
  texto: string
  deEmpresa: boolean
  creadoEn: Date
  autor: { nombre: string | null } | null
}

/**
 * Los mensajes de una postulación. `yoSoyEmpresa` decide qué lado se pinta
 * como propio.
 */
export function Conversacion({
  postulacionId,
  mensajes,
  yoSoyEmpresa,
  nombreEmpresa,
  puedeEscribir,
  sinCuenta,
}: {
  postulacionId: string
  mensajes: Mensaje[]
  yoSoyEmpresa: boolean
  nombreEmpresa: string
  puedeEscribir: boolean
  /** La persona se postuló sin cuenta: no puede leer mensajes aquí. */
  sinCuenta?: boolean
}) {
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <section className="mt-8">
      <h2 className="label border-b-rule border-ink pb-2">Mensajes</h2>

      {mensajes.length === 0 ? (
        <p className="mt-4 text-ink-2">
          {yoSoyEmpresa ? 'Todavía no le has escrito.' : 'La empresa todavía no te ha escrito.'}
        </p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {mensajes.map((m) => {
            const propio = m.deEmpresa === yoSoyEmpresa
            return (
              <li
                key={m.id}
                className={`max-w-[60ch] border-px p-3 ${propio ? 'ml-auto border-purple bg-purple-100' : 'border-line bg-white'}`}
              >
                <p className="text-sm font-semibold">
                  {m.deEmpresa ? nombreEmpresa : (m.autor?.nombre ?? 'Candidato')}
                </p>
                <p className="mt-1 whitespace-pre-line">{m.texto}</p>
                <p className="cifras mt-2 text-sm text-neutral">{fecha.format(m.creadoEn)}</p>
              </li>
            )
          })}
        </ol>
      )}

      {sinCuenta ? (
        <p className="mt-4 border-px border-line bg-off p-3 text-sm text-ink-2">
          Esta persona se postuló sin cuenta y no puede leer mensajes aquí. Contáctala por correo o
          teléfono y registra el contacto.
        </p>
      ) : (
        puedeEscribir && (
          <FormaMensaje
            postulacionId={postulacionId}
            ayuda={
              yoSoyEmpresa
                ? 'Le avisamos que tiene un mensaje tuyo. Tu primer mensaje cuenta como contacto.'
                : 'Le avisamos a la empresa que le respondiste.'
            }
          />
        )
      )}
    </section>
  )
}
