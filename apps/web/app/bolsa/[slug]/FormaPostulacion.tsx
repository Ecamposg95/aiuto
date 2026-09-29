'use client'

import { useState } from 'react'
import Link from 'next/link'

type Falla = { campo: string; mensaje: string }

export function FormaPostulacion({ vacanteSlug }: { vacanteSlug: string }) {
  const [enviando, setEnviando] = useState(false)
  const [fallas, setFallas] = useState<Falla[]>([])
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const fallaDe = (campo: string) => fallas.find((f) => f.campo === campo)?.mensaje

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setFallas([])
    setError(null)

    const datos = Object.fromEntries(new FormData(evento.currentTarget))
    const respuesta = await fetch('/api/postulaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, vacanteSlug }),
    }).catch(() => null)

    setEnviando(false)

    if (!respuesta) return setError('No pudimos conectar. Revisa tu conexión e inténtalo otra vez.')

    const cuerpo = await respuesta.json().catch(() => ({}))
    if (respuesta.ok) return setToken(cuerpo.token ?? null)
    if (respuesta.status === 422) return setFallas(cuerpo.fallas ?? [])
    setError(cuerpo.error ?? 'Algo salió mal. Inténtalo de nuevo.')
  }

  if (token) {
    return (
      <div className="border-rule border-ink bg-off p-5">
        <h3 className="text-h3">Listo, ya quedó tu postulación.</h3>
        <p className="mt-3 text-ink-2">
          Aquí vas a poder ver en qué va, sin tener que preguntar. Guarda esta liga.
        </p>
        <Link href={`/postulacion/${token}`} className="btn mt-5">
          Ver el estado de mi postulación
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="border-rule border-ink p-5">
      <h3 className="text-h3">Postularme</h3>
      <p className="mt-2 text-sm text-ink-2">
        No necesitas cuenta. Con tu correo te avisamos en qué va.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" nombre="nombre" requerido falla={fallaDe('nombre')} />
        <Campo etiqueta="Correo" nombre="correo" tipo="email" requerido falla={fallaDe('correo')} />
        <Campo etiqueta="Teléfono (opcional)" nombre="telefono" tipo="tel" falla={fallaDe('telefono')} />
      </div>

      <label className="mt-4 block">
        <span className="label block">Por qué te interesa (opcional)</span>
        <textarea name="mensaje" rows={4} className="campo mt-2" maxLength={2000} />
      </label>

      {/* Trampa para robots. Invisible y fuera del orden de tabulación. */}
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
        {enviando ? 'Enviando…' : 'Enviar postulación'}
      </button>
    </form>
  )
}

function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  requerido = false,
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
        aria-describedby={falla ? `${nombre}-error` : undefined}
        className={`campo mt-2 ${falla ? 'campo-error' : ''}`}
      />
      {falla && (
        <span id={`${nombre}-error`} role="alert" className="mt-1 block text-sm text-operaciones">
          {falla}
        </span>
      )}
    </label>
  )
}
