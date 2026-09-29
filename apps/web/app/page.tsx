import Link from 'next/link'
import { nivelesConPrecio } from '@aiuto/core'

/** Lo que toda vacante de AIUTO está obligada a declarar. Es la postura del producto. */
const OBLIGATORIOS = [
  ['Sueldo', 'Sin sueldo publicado no se publica la vacante.'],
  ['Seguro social', 'Si se cotiza al 100 % o sobre una parte, con el porcentaje.'],
  ['Prestaciones', 'Qué hay además de lo de ley.'],
  ['Horario', 'Jornada y días, declarados.'],
  ['Modalidad', 'Presencial, híbrido o remoto.'],
  ['Entrevistas', 'Cuántas tiene el proceso, antes de empezarlo.'],
  ['Plazo de cierre', 'En cuántos días espera cerrar la empresa.'],
  ['Conocimientos', 'Qué se necesita saber de verdad.'],
] as const

export default function Home() {
  return (
    <>
      <section className="wrap py-8">
        <p className="label">Bolsa de trabajo</p>
        <h1 className="mt-4 max-w-[18ch] text-display">Aquí sí te dicen cuánto pagan.</h1>
        <p className="mt-5 max-w-[60ch] text-lead text-ink-2">
          Tenemos pocas vacantes. Todas declaran sueldo, prestaciones, horario y cuántas
          entrevistas tiene el proceso. Y cuando te postulas, te enteras de en qué va.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/bolsa" className="btn">
            Ver vacantes
          </Link>
          <Link href="/asesoria" className="btn-secundario">
            Asesoría de empleabilidad
          </Link>
        </div>
      </section>

      <section className="rule bg-off">
        <div className="wrap py-8">
          <h2 className="text-h2">Lo que toda vacante está obligada a declarar</h2>
          <p className="mt-4 max-w-[60ch] text-ink-2">
            No es una recomendación para quien publica: sin estos datos, la vacante no se
            puede guardar.
          </p>
          <ul className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {OBLIGATORIOS.map(([titulo, detalle]) => (
              <li key={titulo} className="border-t-rule border-ink pt-4">
                <h3 className="text-h4">{titulo}</h3>
                <p className="mt-2 text-sm text-ink-2">{detalle}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-8">
        <h2 className="text-h2">Asesoría de empleabilidad</h2>
        <p className="mt-4 max-w-[60ch] text-ink-2">
          Perfilamiento, cotización de mercado, mejora de tu CV y de tu LinkedIn, y
          acompañamiento hasta que te coloques. La da la dirección de AIUTO, en persona.
        </p>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {nivelesConPrecio().map(({ nivel, precio, etiqueta }) => (
            <li key={nivel} className="border-rule border-ink p-5">
              <p className="label">{etiqueta}</p>
              <p className="mt-3 text-metric">
                ${precio.toLocaleString('es-MX')}
                <span className="ml-2 text-sm font-normal text-neutral">MXN</span>
              </p>
            </li>
          ))}
        </ul>
        <Link href="/asesoria" className="btn mt-6">
          Solicitar asesoría
        </Link>
      </section>
    </>
  )
}
