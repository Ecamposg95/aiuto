'use client'

import { useActionState } from 'react'
import { reenviarVerificacion, type EstadoReenvio } from './accionVerificar'

const inicial: EstadoReenvio = {}

export function AvisoVerificar({ correo }: { correo: string }) {
  const [estado, accion, pendiente] = useActionState(reenviarVerificacion, inicial)

  return (
    <div className="mb-8 border-rule border-purple p-5">
      <p className="text-h3">Confirma tu correo</p>
      <p className="mt-2 max-w-[58ch] text-ink-2">
        Te mandamos una liga a {correo}. Al confirmarlo verás aquí las postulaciones que hayas hecho con él.
      </p>
      {estado.enviado ? (
        <p role="status" className="mt-4 text-sm">
          Listo, te mandamos una liga nueva.
        </p>
      ) : (
        <form action={accion} className="mt-4">
          {estado.error && (
            <p role="alert" className="mb-3 text-sm">
              {estado.error}
            </p>
          )}
          <button type="submit" className="btn-secundario" disabled={pendiente}>
            {pendiente ? 'Enviando…' : 'Mandarme otra liga'}
          </button>
        </form>
      )}
    </div>
  )
}
