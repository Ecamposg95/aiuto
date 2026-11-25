'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { confirmarCorreo, type EstadoVerificar } from '../accion'

const inicial: EstadoVerificar = {}

export function FormaConfirmar({ ficha }: { ficha: string }) {
  const [estado, accion, pendiente] = useActionState(confirmarCorreo, inicial)

  if (estado.listo) {
    return (
      <div role="status" className="mt-6">
        <p className="text-h3">Correo confirmado</p>
        <p className="mt-2 text-ink-2">Ya puedes ver en tu cuenta todas tus postulaciones.</p>
        <Link href="/mi" className="btn mt-5">
          Ir a mi cuenta
        </Link>
      </div>
    )
  }

  return (
    <form action={accion} className="mt-6">
      <input type="hidden" name="ficha" value={ficha} />
      {estado.error && (
        <p role="alert" className="mb-4 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {estado.error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pendiente}>
        {pendiente ? 'Confirmando…' : 'Confirmar mi correo'}
      </button>
    </form>
  )
}
