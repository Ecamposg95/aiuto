'use client'

import { useState } from 'react'

type Categoria = { slug: string; nombre: string }
type Falla = { campo: string; mensaje: string }

export function FormaContacto({
  categorias,
  categoriaInicial,
}: {
  categorias: Categoria[]
  categoriaInicial?: string
}) {
  const [enviando, setEnviando] = useState(false)
  const [fallas, setFallas] = useState<Falla[]>([])
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const fallaDe = (c: string) => fallas.find((f) => f.campo === c)?.mensaje

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setFallas([])
    setError(null)

    const datos = Object.fromEntries(new FormData(e.currentTarget))
    const r = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, origen: 'contacto' }),
    }).catch(() => null)

    setEnviando(false)
    if (!r) return setError('No pudimos conectar. Inténtalo otra vez.')

    const cuerpo = await r.json().catch(() => ({}))
    if (r.ok) return setListo(true)
    if (r.status === 422) return setFallas(cuerpo.fallas ?? [])
    setError(cuerpo.error ?? 'Algo salió mal.')
  }

  if (listo) {
    return (
      <div className="border-rule border-ink bg-off p-5">
        <h2 className="text-h3">Recibimos tu mensaje.</h2>
        <p className="mt-3 text-ink-2">
          Alguien del equipo lo va a leer y te contesta. No se pierde: queda registrado con
          responsable y seguimiento.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="border-rule border-ink p-5">
      <label className="block">
        <span className="label block">¿Qué necesitas?</span>
        <select name="tipo" defaultValue="CATEGORIA" className="campo mt-2">
          <option value="CATEGORIA">Un servicio de consultoría</option>
          <option value="EMPRESA">Publicar una vacante</option>
          <option value="CONTACTO">Otra cosa</option>
        </select>
      </label>

      <label className="mt-4 block">
        <span className="label block">Categoría (si aplica)</span>
        <select name="categoriaSlug" defaultValue={categoriaInicial ?? ''} className="campo mt-2">
          <option value="">No estoy seguro</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" nombre="nombre" requerido falla={fallaDe('nombre')} />
        <Campo etiqueta="Correo" nombre="correo" tipo="email" requerido falla={fallaDe('correo')} />
        <Campo etiqueta="Teléfono (opcional)" nombre="telefono" tipo="tel" falla={fallaDe('telefono')} />
        <Campo etiqueta="Empresa (opcional)" nombre="empresa" falla={fallaDe('empresa')} />
      </div>

      <label className="mt-4 block">
        <span className="label block">Cuéntanos</span>
        <textarea
          name="mensaje"
          rows={5}
          required
          maxLength={2000}
          aria-invalid={fallaDe('mensaje') ? true : undefined}
          className={`campo mt-2 ${fallaDe('mensaje') ? 'campo-error' : ''}`}
        />
        {fallaDe('mensaje') && (
          <span role="alert" className="mt-1 block text-sm text-operaciones">
            {fallaDe('mensaje')}
          </span>
        )}
      </label>

      <div aria-hidden className="absolute left-[-9999px]">
        <label>
          Sitio web
          <input type="text" name="sitioWeb" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {error}
        </p>
      )}

      <button type="submit" className="btn mt-5" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}

function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  requerido,
  falla,
}: {
  etiqueta: string
  nombre: string
  tipo?: string
  requerido?: boolean
  falla?: string
}) {
  return (
    <label className="block">
      <span className="label block">{etiqueta}</span>
      <input
        type={tipo}
        name={nombre}
        required={requerido}
        aria-invalid={falla ? true : undefined}
        className={`campo mt-2 ${falla ? 'campo-error' : ''}`}
      />
      {falla && (
        <span role="alert" className="mt-1 block text-sm text-operaciones">
          {falla}
        </span>
      )}
    </label>
  )
}
