import { prisma } from '@aiuto/db'
import { agregarExperiencia, agregarFormacion, agregarEvidencia, borrarDeTrayectoria } from './trayectoria'

/**
 * Trayectoria, formación y evidencias. Cada lista se captura de a uno, con su
 * propio formulario: la captura progresiva que pide el máster prompt §8.1, sin
 * un formulario interminable.
 */
export async function Trayectoria({ perfilId }: { perfilId: string }) {
  const [experiencias, formaciones, evidencias] = await Promise.all([
    prisma.experiencia.findMany({ where: { perfilId }, orderBy: { orden: 'asc' } }),
    prisma.formacion.findMany({ where: { perfilId }, orderBy: { orden: 'asc' } }),
    prisma.evidencia.findMany({ where: { perfilId }, orderBy: { orden: 'asc' } }),
  ])

  return (
    <>
      <section className="mt-7">
        <h2 className="text-h3 border-b-rule border-ink pb-2">Trayectoria</h2>
        <p className="mt-3 text-sm text-ink-2">
          Enfocada en resultados: de tres a cinco logros por puesto, uno por renglón. «Bajé el tiempo de
          entrega de 5 a 3 días» dice más que «responsable de logística».
        </p>
        <ul className="mt-3">
          {experiencias.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 border-b-px border-line py-3">
              <div>
                <p className="text-h4">{e.puesto} · <span className="font-normal">{e.empresa}</span></p>
                {(e.desde || e.hasta) && <p className="text-sm text-ink-2">{e.desde} – {e.hasta ?? 'actual'}</p>}
                {e.logros.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">{e.logros.map((l) => <li key={l}>{l}</li>)}</ul>
                )}
              </div>
              <Borrar id={e.id} tipo="experiencia" />
            </li>
          ))}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-purple underline">Agregar un puesto</summary>
          <form action={agregarExperiencia} className="mt-3 grid gap-3 border-px border-line p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Entrada etiqueta="Puesto" nombre="puesto" requerido />
              <Entrada etiqueta="Empresa" nombre="empresa" requerido />
              <Entrada etiqueta="Desde" nombre="desde" ejemplo="mar 2021" />
              <Entrada etiqueta="Hasta" nombre="hasta" ejemplo="actual" />
            </div>
            <label className="block">
              <span className="label block">Logros (uno por renglón)</span>
              <textarea name="logros" rows={4} className="campo mt-1" />
            </label>
            <button className="btn-secundario w-fit px-4 py-2 text-sm">Agregar</button>
          </form>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="text-h3 border-b-rule border-ink pb-2">Formación</h2>
        <ul className="mt-3">
          {formaciones.map((f) => (
            <li key={f.id} className="flex items-start justify-between gap-3 border-b-px border-line py-3">
              <p>{f.titulo} · <span className="text-ink-2">{f.institucion}{f.anio ? `, ${f.anio}` : ''}</span></p>
              <Borrar id={f.id} tipo="formacion" />
            </li>
          ))}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-purple underline">Agregar estudios</summary>
          <form action={agregarFormacion} className="mt-3 grid gap-3 border-px border-line p-4 sm:grid-cols-3">
            <Entrada etiqueta="Título" nombre="titulo" requerido />
            <Entrada etiqueta="Institución" nombre="institucion" requerido />
            <Entrada etiqueta="Año" nombre="anio" tipo="number" />
            <button className="btn-secundario w-fit px-4 py-2 text-sm">Agregar</button>
          </form>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="text-h3 border-b-rule border-ink pb-2">Evidencias de tu trabajo</h2>
        <p className="mt-3 text-sm text-ink-2">
          Proyectos, tableros, aplicaciones, repositorios o diseños. Para perfiles técnicos pesa más que
          cualquier descripción.
        </p>
        <ul className="mt-3">
          {evidencias.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 border-b-px border-line py-3">
              <p>{e.titulo} <span className="text-sm text-ink-2">· {e.url}</span></p>
              <Borrar id={e.id} tipo="evidencia" />
            </li>
          ))}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-purple underline">Agregar una evidencia</summary>
          <form action={agregarEvidencia} className="mt-3 grid gap-3 border-px border-line p-4 sm:grid-cols-2">
            <Entrada etiqueta="Qué es" nombre="titulo" requerido ejemplo="Tablero de ventas en Power BI" />
            <Entrada etiqueta="Liga" nombre="url" tipo="url" requerido ejemplo="https://" />
            <button className="btn-secundario w-fit px-4 py-2 text-sm">Agregar</button>
          </form>
        </details>
      </section>
    </>
  )
}

function Entrada({ etiqueta, nombre, tipo = 'text', requerido, ejemplo }: { etiqueta: string; nombre: string; tipo?: string; requerido?: boolean; ejemplo?: string }) {
  return (
    <label className="block">
      <span className="label block">{etiqueta}</span>
      <input type={tipo} name={nombre} required={requerido} placeholder={ejemplo} className="campo mt-1" />
    </label>
  )
}

function Borrar({ id, tipo }: { id: string; tipo: string }) {
  return (
    <form action={borrarDeTrayectoria}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="tipo" value={tipo} />
      <button className="text-sm text-ink-2 underline hover:text-operaciones">Quitar</button>
    </form>
  )
}
