import type { EstadoPostulacion } from '@aiuto/core'

/** Los tres pasos que recorre una postulación antes de resolverse. */
const PASOS = [
  { estado: 'RECIBIDA', corto: 'Recibida' },
  { estado: 'EN_REVISION', corto: 'En revisión' },
  { estado: 'ENTREVISTA', corto: 'Entrevista' },
] as const

const DESENLACE: Partial<Record<EstadoPostulacion, { corto: string; bueno: boolean }>> = {
  CONTRATADA: { corto: 'Contratada', bueno: true },
  RECHAZADA: { corto: 'No siguió', bueno: false },
  VACANTE_CUBIERTA: { corto: 'Se cubrió', bueno: false },
}

/**
 * Dónde va la postulación.
 *
 * Existe porque es lo único que alguien quiere saber al entrar, y porque una
 * palabra suelta no dice si falta mucho o poco. Ver los pasos completos, con el
 * tuyo marcado, responde eso sin leer nada.
 */
export function Avance({ estado }: { estado: EstadoPostulacion }) {
  const desenlace = DESENLACE[estado]
  const indice = PASOS.findIndex((p) => p.estado === estado)
  // Una postulación resuelta llegó hasta el final de los pasos.
  const alcanzado = desenlace ? PASOS.length : indice

  return (
    <ol className="mt-4 flex items-stretch gap-1" aria-label="Avance de la postulación">
      {PASOS.map((paso, i) => {
        const hecho = i <= alcanzado
        const aqui = i === indice && !desenlace
        return (
          <li key={paso.estado} className="flex-1">
            <div
              className={`h-1 ${hecho ? 'bg-purple' : 'bg-line'}`}
              aria-hidden
            />
            <p
              className={`mt-2 text-sm ${aqui ? 'font-semibold text-purple' : hecho ? 'text-ink-2' : 'text-neutral'}`}
            >
              {paso.corto}
              {aqui && <span className="sr-only"> (aquí estás)</span>}
            </p>
          </li>
        )
      })}

      <li className="flex-1">
        <div
          className={`h-1 ${
            desenlace ? (desenlace.bueno ? 'bg-capital-humano' : 'bg-line') : 'bg-line'
          }`}
          aria-hidden
        />
        <p
          className={`mt-2 text-sm ${
            desenlace
              ? desenlace.bueno
                ? 'font-semibold text-capital-humano-dark'
                : 'font-semibold text-ink-2'
              : 'text-neutral'
          }`}
        >
          {desenlace?.corto ?? 'Resultado'}
        </p>
      </li>
    </ol>
  )
}
