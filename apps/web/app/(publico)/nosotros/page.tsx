import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'AIUTO es un ecosistema de especialistas y soluciones para empresas y profesionales.',
}

const VALORES = [
  ['Confianza', 'Especialistas validados y procesos transparentes.'],
  ['Cercanía', 'Una conversación humana antes que una propuesta.'],
  ['Excelencia', 'Nivel senior en cada disciplina.'],
  ['Colaboración', 'Equipos multidisciplinarios para cada proyecto.'],
  ['Integridad', 'Recomendamos lo que el caso requiere, no lo que más conviene vender.'],
  ['Compromiso', 'Acompañamos hasta el resultado.'],
] as const

export default function Nosotros() {
  return (
    <div className="wrap py-7">
      <p className="label">Nosotros</p>
      <h1 className="mt-3 max-w-[22ch] text-h1">Un ecosistema para que empresas y personas crezcan</h1>
      <p className="mt-4 max-w-[62ch] text-lead text-ink-2">
        AIUTO no es solo una consultora, una agencia de reclutamiento ni una bolsa de trabajo. Es un
        ecosistema que entiende la necesidad, la conecta con la solución adecuada y acompaña su
        ejecución.
      </p>

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        <div className="tarjeta">
          <h2 className="text-h3">Misión</h2>
          <p className="mt-2 text-ink-2">
            Conectar empresas y personas con especialistas de alto nivel mediante un ecosistema
            profesional que facilite el acceso a soluciones confiables, genere valor sostenible y
            acompañe cada proyecto hasta la obtención de resultados.
          </p>
        </div>
        <div className="tarjeta">
          <h2 className="text-h3">Visión</h2>
          <p className="mt-2 text-ink-2">
            Ser el ecosistema de referencia en Latinoamérica para conectar talento, conocimiento y
            servicios especializados.
          </p>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-h2">Lo que nos guía</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALORES.map(([titulo, texto]) => (
            <li key={titulo} className="tarjeta">
              <p className="text-h4">{titulo}</p>
              <p className="mt-1 text-sm text-ink-2">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7 grid gap-6 rounded-tarjeta bg-off p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-h3">La tecnología facilita; el criterio humano resuelve</h2>
          <p className="mt-2 max-w-[62ch] text-ink-2">
            La plataforma ordena solicitudes, publica oportunidades y avisa cuando algo se atora. Las
            decisiones importantes —entender un problema complejo, recomendar a un especialista,
            acompañar un cambio— las toma una persona. Damián Medina encabeza AIUTO y es el primer
            contacto para empresas y para quien busca mejorar su empleabilidad.
          </p>
        </div>
        <Link href="/contacto" className="btn">Contáctanos</Link>
      </section>
    </div>
  )
}
