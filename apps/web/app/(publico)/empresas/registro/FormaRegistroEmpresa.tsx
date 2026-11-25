'use client'

import { useActionState } from 'react'
import { registrarEmpresa, type EstadoRegistroEmpresa } from './accion'

const inicial: EstadoRegistroEmpresa = {}

export function FormaRegistroEmpresa() {
  const [estado, accion, pendiente] = useActionState(registrarEmpresa, inicial)
  const falla = (c: string) => estado.fallas?.find((f) => f.campo === c)?.mensaje
  const valor = (c: string) => estado.valores?.[c] ?? ''

  return (
    <form action={accion} key={estado.intento ?? 0} className="mt-6 border-rule border-ink p-5">
      <fieldset>
        <legend className="label border-b-rule border-ink pb-2">La empresa</legend>
        <Campo etiqueta="Nombre de la empresa" nombre="empresa" falla={falla('empresa')} valor={valor('empresa')} autoComplete="organization" />
        <Campo etiqueta="Ciudad" nombre="ubicacion" falla={falla('ubicacion')} valor={valor('ubicacion')} />
        <Campo etiqueta="Sitio web (opcional)" nombre="sitio" tipo="url" falla={falla('sitio')} valor={valor('sitio')} requerido={false} />
        <label className="mt-4 block">
          <span className="label block">A qué se dedica (opcional)</span>
          <textarea name="descripcion" rows={3} defaultValue={valor('descripcion')} className="campo mt-2" />
        </label>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label border-b-rule border-ink pb-2">Quién recluta</legend>
        <Campo etiqueta="Tu nombre" nombre="nombre" falla={falla('nombre')} valor={valor('nombre')} autoComplete="name" />
        <Campo etiqueta="Tu puesto (opcional)" nombre="puesto" falla={falla('puesto')} valor={valor('puesto')} requerido={false} />
        <Campo etiqueta="Correo de trabajo" nombre="correo" tipo="email" falla={falla('correo')} valor={valor('correo')} autoComplete="email" />
        <Campo etiqueta="Teléfono (opcional)" nombre="telefono" tipo="tel" falla={falla('telefono')} valor={valor('telefono')} requerido={false} autoComplete="tel" />
        <Campo etiqueta="Contraseña" nombre="password" tipo="password" falla={falla('password')} autoComplete="new-password" ayuda="Al menos 8 caracteres." />
      </fieldset>

      <div aria-hidden className="absolute left-[-9999px]">
        <label>
          Sitio web
          <input type="text" name="sitioWeb" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {estado.error && (
        <p role="alert" className="mt-4 border-px border-operaciones bg-operaciones-tint p-3 text-sm">
          {estado.error}
        </p>
      )}

      <button type="submit" className="btn mt-5 w-full" disabled={pendiente}>
        {pendiente ? 'Enviando…' : 'Registrar mi empresa'}
      </button>
    </form>
  )
}

function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  falla,
  valor,
  ayuda,
  requerido = true,
  autoComplete,
}: {
  etiqueta: string
  nombre: string
  tipo?: string
  falla?: string
  valor?: string
  ayuda?: string
  requerido?: boolean
  autoComplete?: string
}) {
  return (
    <label className="mt-4 block">
      <span className="label block">{etiqueta}</span>
      <input
        type={tipo}
        name={nombre}
        required={requerido}
        defaultValue={valor}
        autoComplete={autoComplete}
        aria-invalid={falla ? true : undefined}
        className={`campo mt-2 ${falla ? 'campo-error' : ''}`}
      />
      {ayuda && !falla && <span className="mt-1 block text-sm text-neutral">{ayuda}</span>}
      {falla && (
        <span role="alert" className="mt-1 block text-sm text-operaciones">
          {falla}
        </span>
      )}
    </label>
  )
}
