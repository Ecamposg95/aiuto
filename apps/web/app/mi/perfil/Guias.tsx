/**
 * Orientación para el CV y el video pitch (máster prompt §8.2 y §8.3). Plegada
 * para no alargar la página a quien ya la leyó.
 */
export function Guias() {
  return (
    <section className="mt-6 grid gap-3">
      <details className="border-px border-line p-4">
        <summary className="cursor-pointer text-h4">Cómo armar un CV que sí se lee</summary>
        <ul className="mt-3 list-disc pl-5 text-ink-2">
          <li>Dos cuartillas como máximo si tienes experiencia; una si vas empezando.</li>
          <li>Arriba, quién eres y qué ofreces en una línea.</li>
          <li>Un perfil breve: tres o cuatro renglones.</li>
          <li>Trayectoria con resultados: de tres a cinco logros por puesto, con números cuando se pueda.</li>
          <li>Competencias que el mercado pide para lo que buscas.</li>
          <li>Estudios relevantes. Quita cursos y datos que no suman.</li>
          <li>Si usas foto, que sea profesional, a color y con expresión amable.</li>
        </ul>
      </details>
      <details className="border-px border-line p-4">
        <summary className="cursor-pointer text-h4">Cómo grabar tu video pitch</summary>
        <p className="mt-3 text-ink-2">Alrededor de un minuto; dos como máximo. Cuenta, con tus palabras:</p>
        <ol className="mt-2 list-decimal pl-5 text-ink-2">
          <li>Quién eres profesionalmente.</li>
          <li>Qué sabes hacer.</li>
          <li>Qué resultados puedes generar.</li>
          <li>Qué te distingue.</li>
          <li>Qué oportunidad buscas.</li>
        </ol>
        <p className="mt-2 text-ink-2">No lo leas: practica dos o tres veces y grábalo como si platicaras.</p>
      </details>
    </section>
  )
}
