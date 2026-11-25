'use client'

import { useActionState } from 'react'
import { pedirLiga, type EstadoPedir } from './accion'

const inicial: EstadoPedir = {}

const MENSAJE =
  'Si hay una cuenta con ese correo, te mandamos una liga para cambiar la contraseña. Revisa también el correo no deseado.'

export function FormaPedir() {
  const [estado, accion, pendiente] = useActionState(pedirLiga, inicial)

  if (estado.enviado) {
    return (
      <p role="status" className="mt-6 border-rule border-ink p-5">
        {MENSAJE}
      </p>
    )
  }

  return (
    <form action={accion} className="mt-6 border-rule border-ink p-5">
      <label className="block">
        <span className="label block">Correo de tu cuenta</span>
        <input type="email" name="correo" required autoComplete="email" className="campo mt-2" />
      </label>

      {estado.error && (
        <p role="alert" className="mt-4 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn mt-5 w-full" disabled={pendiente}>
        {pendiente ? 'Enviando…' : 'Mandarme la liga'}
      </button>
    </form>
  )
}
