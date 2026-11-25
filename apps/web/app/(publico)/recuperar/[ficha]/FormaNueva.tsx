'use client'

import { useActionState } from 'react'
import { ponerNueva, type EstadoNueva } from '../accion'

const inicial: EstadoNueva = {}

export function FormaNueva({ ficha }: { ficha: string }) {
  const [estado, accion, pendiente] = useActionState(ponerNueva, inicial)

  return (
    <form action={accion} key={estado.intento ?? 0} className="mt-6 border-rule border-ink p-5">
      <input type="hidden" name="ficha" value={ficha} />
      <label className="block">
        <span className="label block">Contraseña nueva</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="campo mt-2"
        />
        <span className="mt-1 block text-sm text-ink-2">Al menos 8 caracteres.</span>
      </label>

      {estado.error && (
        <p role="alert" className="mt-4 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn mt-5 w-full" disabled={pendiente}>
        {pendiente ? 'Guardando…' : 'Guardar la contraseña nueva'}
      </button>
    </form>
  )
}
