'use client'

import { useActionState } from 'react'
import { enviarMensaje, type EstadoMensaje } from '@/lib/mensajes'

const inicial: EstadoMensaje = {}

export function FormaMensaje({ postulacionId, ayuda }: { postulacionId: string; ayuda?: string }) {
  const [estado, accion, pendiente] = useActionState(enviarMensaje, inicial)

  return (
    // La llave cambia en cada envío: el campo se vacía al mandar bien.
    <form action={accion} key={estado.intento ?? 0} className="mt-4">
      <input type="hidden" name="postulacionId" value={postulacionId} />
      <label className="block">
        <span className="label block">Escribir un mensaje</span>
        <textarea name="texto" rows={3} required maxLength={4000} className="campo mt-2" />
      </label>
      {ayuda && <p className="mt-1 text-sm text-neutral">{ayuda}</p>}
      {estado.error && (
        <p role="alert" className="mt-3 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {estado.error}
        </p>
      )}
      <button type="submit" className="btn mt-3" disabled={pendiente}>
        {pendiente ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  )
}
