import type { Metadata } from 'next'
import { nivelesConPrecio } from '@aiuto/core'
import { FormaAsesoria } from './FormaAsesoria'

export const metadata: Metadata = {
  title: 'Asesoría de empleabilidad',
  description:
    'Perfilamiento, cotización de mercado, mejora de CV y LinkedIn, y acompañamiento hasta que te coloques.',
}

const INCLUYE = [
  ['Perfilamiento', 'En qué eres bueno de verdad, y qué no quieres volver a hacer.'],
  ['Cotización de mercado', 'Cuánto vale hoy tu perfil, con números.'],
  ['Tu CV', 'Reescrito para que lo lea quien decide, no un filtro.'],
  ['Tu LinkedIn', 'Usarlo de forma profesional sin pagar la licencia premium.'],
  ['Acompañamiento', 'Seguimiento hasta que te coloques.'],
  ['Roster preferencial', 'Al validar aptitudes, entras a la lista que revisamos primero.'],
] as const

export default function Asesoria() {
  return (
    <div className="wrap py-7">
      <p className="label">Servicio</p>
      <h1 className="mt-3 max-w-[20ch] text-h1">Asesoría de empleabilidad</h1>
      <p className="mt-4 max-w-[62ch] text-lead text-ink-2">
        La da la dirección de AIUTO, en persona. No es un curso grabado ni una plantilla: es
        alguien sentado contigo revisando tu caso.
      </p>

      <section className="mt-7">
        <h2 className="label border-b-rule border-ink pb-2">Qué incluye</h2>
        <ul className="mt-4 grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUYE.map(([titulo, detalle]) => (
            <li key={titulo}>
              <h3 className="text-h4">{titulo}</h3>
              <p className="mt-1 text-sm text-ink-2">{detalle}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <FormaAsesoria niveles={nivelesConPrecio()} />
      </section>
    </div>
  )
}
