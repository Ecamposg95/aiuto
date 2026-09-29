'use client'

import { useActionState } from 'react'
import { acceder, type EstadoEntrada } from './accion'

const inicial: EstadoEntrada = {}

export function FormaEntrar() {
  const [estado, accion, pendiente] = useActionState(acceder, inicial)

  return (
    <form action={accion} className="mt-6 border-rule border-ink p-5">
      <label className="block">
        <span className="label block">Correo</span>
        <input type="email" name="email" required autoComplete="username" className="campo mt-2" />
      </label>

      <label className="mt-4 block">
        <span className="label block">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="campo mt-2"
        />
      </label>

      {estado.error && (
        <p role="alert" className="mt-4 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn mt-5 w-full" disabled={pendiente}>
        {pendiente ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
