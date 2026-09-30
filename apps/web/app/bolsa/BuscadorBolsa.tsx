import Link from 'next/link'

type Categoria = { slug: string; corto: string; color: string; _count: { vacantes: number } }

/**
 * Buscador de la bolsa.
 *
 * Es un formulario GET a propósito: funciona sin JavaScript, la búsqueda queda
 * en la URL y se puede compartir o guardar en favoritos. Una bolsa de trabajo
 * cuyos resultados no se pueden mandar por WhatsApp sirve de poco.
 */
export function BuscadorBolsa({
  categorias,
  actual,
}: {
  categorias: Categoria[]
  actual: { q?: string; categoria?: string; modalidad?: string; desde?: string }
}) {
  const hayFiltro = Boolean(actual.q || actual.categoria || actual.modalidad || actual.desde)

  return (
    <div className="mt-6">
      <form method="get" action="/bolsa" className="border-rule border-ink p-4">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="label block">Qué buscas</span>
            <input
              type="search"
              name="q"
              defaultValue={actual.q ?? ''}
              placeholder="Puesto, empresa, ciudad o habilidad"
              className="campo mt-2"
            />
          </label>

          <label className="block">
            <span className="label block">Modalidad</span>
            <select name="modalidad" defaultValue={actual.modalidad ?? ''} className="campo mt-2">
              <option value="">Cualquiera</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
              <option value="REMOTO">Remoto</option>
            </select>
          </label>

          <label className="block">
            <span className="label block">Desde (al mes)</span>
            <select name="desde" defaultValue={actual.desde ?? ''} className="campo mt-2">
              <option value="">Cualquiera</option>
              <option value="15000">$15,000</option>
              <option value="25000">$25,000</option>
              <option value="40000">$40,000</option>
              <option value="60000">$60,000</option>
              <option value="100000">$100,000</option>
            </select>
          </label>

          {/* La categoría se elige con las pestañas de abajo; se arrastra para
              no perderla al buscar. */}
          {actual.categoria && <input type="hidden" name="categoria" value={actual.categoria} />}

          <button type="submit" className="btn h-[46px]">
            Buscar
          </button>
        </div>

        {hayFiltro && (
          <p className="mt-3 text-sm">
            <Link href="/bolsa" className="text-purple underline">
              Quitar todos los filtros
            </Link>
          </p>
        )}
      </form>

      {categorias.length > 0 && (
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          <Enlace
            href={liga({ ...actual, categoria: undefined })}
            activo={!actual.categoria}
            texto="Todas"
          />
          {categorias.map((c) => (
            <Enlace
              key={c.slug}
              href={liga({ ...actual, categoria: c.slug })}
              activo={actual.categoria === c.slug}
              color={c.color}
              texto={c.corto}
              cuenta={c._count.vacantes}
            />
          ))}
        </nav>
      )}
    </div>
  )
}

/** Conserva los filtros activos al cambiar de categoría. */
function liga(estado: Record<string, string | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(estado)) if (v) p.set(k, v)
  const s = p.toString()
  return s ? `/bolsa?${s}` : '/bolsa'
}

function Enlace({
  href,
  activo,
  texto,
  cuenta,
  color,
}: {
  href: string
  activo: boolean
  texto: string
  cuenta?: number
  color?: string
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? 'true' : undefined}
      style={{ borderColor: activo && color ? color : undefined }}
      className={`border-px px-3 py-2 text-sm transition ${
        activo ? 'border-rule border-ink bg-off text-ink' : 'border-line text-ink-2 hover:border-ink'
      }`}
    >
      {texto}
      {cuenta !== undefined && <span className="ml-1 text-neutral">({cuenta})</span>}
    </Link>
  )
}
