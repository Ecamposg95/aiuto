'use client'

import { useState } from 'react'
import type { NivelCandidato } from '@aiuto/core'

type Nivel = { nivel: NivelCandidato; precio: number; etiqueta: string }
type Falla = { campo: string; mensaje: string }

export function FormaAsesoria({ niveles }: { niveles: Nivel[] }) {
  const [elegido, setElegido] = useState<NivelCandidato | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [fallas, setFallas] = useState<Falla[]>([])
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const precio = niveles.find((n) => n.nivel === elegido)?.precio
  const fallaDe = (campo: string) => fallas.find((f) => f.campo === campo)?.mensaje

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setFallas([])
    setError(null)

    const datos = Object.fromEntries(new FormData(e.currentTarget))
    const r = await fetch('/api/asesorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, nivel: elegido }),
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
        <h2 className="text-h3">Recibimos tu solicitud.</h2>
        <p className="mt-3 text-ink-2">
          La dirección de AIUTO se pone en contacto contigo para acordar cómo empezamos. No se
          te cobró nada todavía.
        </p>
      </div>
    )
  }

  return (
    <div>
      <fieldset className="border-0 p-0">
        <legend className="label">¿En qué momento estás?</legend>
        <p className="mt-2 text-sm text-ink-2">
          Lo único que cambia entre los tres es el precio.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {niveles.map((n) => (
            <label
              key={n.nivel}
              className={`cursor-pointer border-rule p-4 transition ${
                elegido === n.nivel ? 'border-purple bg-purple-100' : 'border-line hover:border-ink'
              }`}
            >
              <input
                type="radio"
                name="nivelVisible"
                value={n.nivel}
                checked={elegido === n.nivel}
                onChange={() => setElegido(n.nivel)}
                className="sr-only"
              />
              <span className="label block">{n.etiqueta}</span>
              <span className="mt-2 block text-h2">{`$${n.precio.toLocaleString('es-MX')}`}</span>
              <span className="text-sm text-neutral">MXN</span>
            </label>
          ))}
        </div>
      </fieldset>

      {elegido && (
        <form onSubmit={enviar} noValidate className="mt-6 border-rule border-ink p-5">
          <p className="text-h4">{`Asesoría por $${precio?.toLocaleString('es-MX')} MXN`}</p>
          <p className="mt-2 text-sm text-ink-2">
            Déjanos tus datos y te contactamos. El pago se acuerda por fuera; este formulario no
            cobra nada.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre" nombre="nombre" requerido falla={fallaDe('nombre')} />
            <Campo etiqueta="Correo" nombre="correo" tipo="email" requerido falla={fallaDe('correo')} />
            <Campo etiqueta="Teléfono (opcional)" nombre="telefono" tipo="tel" falla={fallaDe('telefono')} />
          </div>

          <label className="mt-4 block">
            <span className="label block">Qué buscas (opcional)</span>
            <textarea name="mensaje" rows={4} maxLength={2000} className="campo mt-2" />
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
            {enviando ? 'Enviando…' : 'Solicitar asesoría'}
          </button>
        </form>
      )}
    </div>
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
