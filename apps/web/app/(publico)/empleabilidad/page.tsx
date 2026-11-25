import Link from 'next/link'
import type { Metadata } from 'next'
import { nivelesAsesoria } from '@aiuto/core'
import { BotonWhatsApp, MENSAJES_WHATSAPP, ligaWhatsApp } from '@/components/BotonWhatsApp'
import { FormaAsesoria } from './FormaAsesoria'

export const metadata: Metadata = {
  title: 'Empleabilidad',
  description:
    'Asesoría para fortalecer tu perfil profesional: CV, LinkedIn, pitch, entrevistas y estrategia de búsqueda. Dos sesiones remotas de una hora.',
}

/** Lo que cubre el servicio (máster prompt §12). */
const CONTENIDOS = [
  'Diagnóstico de tu perfil profesional',
  'Tus fortalezas y áreas de mejora',
  'Qué buscas de verdad en tu siguiente paso',
  'Qué te falta frente a lo que pide el mercado',
  'Tu propuesta de valor',
  'Tu CV y tu LinkedIn, optimizados',
  'Tu pitch profesional',
  'Dónde y cómo buscar vacantes',
  'Networking y el mercado laboral oculto',
  'Preparación para entrevistas',
  'Herramientas de IA para tu búsqueda',
  'Un plan de acción con seguimiento',
] as const

const PARA_QUIEN = [
  'Llevas tiempo postulándote y no te llaman.',
  'Quieres cambiar de área o subir de nivel y no sabes cómo presentarte.',
  'Tu CV y tu LinkedIn no reflejan lo que sabes hacer.',
  'Vas a entrevistas pero no cierras.',
] as const

export default function Empleabilidad() {
  const whatsapp = ligaWhatsApp(MENSAJES_WHATSAPP.empleabilidad)

  return (
    <>
      <div className="wrap py-7">
        <p className="label">Empleabilidad</p>
        <h1 className="mt-3 max-w-[22ch] text-h1">Transforma tu perfil profesional y mejora tus oportunidades</h1>
        <p className="mt-4 max-w-[62ch] text-lead text-ink-2">
          No es la bolsa de trabajo: aquí no te postulas a vacantes. Es una asesoría para que compitas
          mejor en cualquier proceso, con alguien que revisa tu caso contigo.
        </p>

        <section className="mt-7 grid gap-6 lg:grid-cols-2">
          <div className="tarjeta">
            <h2 className="text-h3">¿Te pasa algo de esto?</h2>
            <ul className="mt-3 grid gap-2 text-ink-2">
              {PARA_QUIEN.map((p) => <li key={p}>· {p}</li>)}
            </ul>
          </div>
          <div className="tarjeta">
            <h2 className="text-h3">Cómo funciona</h2>
            <p className="mt-3 text-ink-2">
              El servicio base son <strong className="text-ink">dos sesiones remotas de una hora</strong>, más el
              acompañamiento que acordemos según tu caso. Sales con tu CV, tu LinkedIn y tu pitch listos, y
              con un plan de búsqueda.
            </p>
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-h2">Qué trabajamos contigo</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONTENIDOS.map((c, i) => (
              <li key={c} className="tarjeta flex gap-3">
                <span className="cifras text-purple">{String(i + 1).padStart(2, '0')}</span>
                {c}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="text-h2">Cómo empezar</h2>
            <p className="mt-3 max-w-[46ch] text-ink-2">
              Déjanos tus datos y te contactamos para platicar tu caso y explicarte las condiciones.
              {whatsapp ? ' Si prefieres, escríbenos por WhatsApp.' : ''}
            </p>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secundario mt-5">
                Escribir por WhatsApp
              </a>
            )}
            <p className="mt-6 text-sm text-ink-2">
              ¿Buscas vacantes? Eso está en la{' '}
              <Link href="/bolsa" className="text-purple underline">Bolsa de Trabajo</Link>, y ahí todo el proceso
              ocurre dentro de AIUTO.
            </p>
          </div>
          <FormaAsesoria niveles={nivelesAsesoria()} />
        </section>
      </div>
      <BotonWhatsApp mensaje={MENSAJES_WHATSAPP.empleabilidad} />
    </>
  )
}
