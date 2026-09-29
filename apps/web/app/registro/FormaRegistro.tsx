'use client'

import { useActionState } from 'react'
import { registrar, type EstadoRegistro } from './accion'

const inicial: EstadoRegistro = {}

export function FormaRegistro() {
  const [estado, accion, pendiente] = useActionState(registrar, inicial)
  const falla = (c: string) => estado.fallas?.find((f) => f.campo === c)?.mensaje

  // Remonta al rechazar, igual que las otras formas: si solo se re-renderiza,
  // cambiar `defaultValue` sobre un input ya montado deja el DOM en un estado
  // que depende del momento, y el segundo intento llegaba a enviar la
  // contrasena anterior.
  const llave = JSON.stringify(estado.valores ?? null) + (estado.fallas?.length ?? 0)

  return (
    <form action={accion} key={llave} className="mt-6 border-rule border-ink p-5">
      <Campo
        etiqueta="Nombre"
        nombre="nombre"
        falla={falla('nombre')}
        autoComplete="name"
        valor={estado.valores?.nombre ?? ''}
      />
      <Campo
        etiqueta="Correo"
        nombre="correo"
        tipo="email"
        falla={falla('correo')}
        autoComplete="email"
        ayuda="Si ya te postulaste con este correo, vas a encontrar tu historial."
        valor={estado.valores?.correo ?? ''}
      />
      <Campo
        etiqueta="Contraseña"
        nombre="password"
        tipo="password"
        falla={falla('password')}
        autoComplete="new-password"
        ayuda="Al menos 8 caracteres."
      />

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
        {pendiente ? 'Creando…' : 'Crear mi cuenta'}
      </button>
    </form>
  )
}

function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  falla,
  ayuda,
  autoComplete,
  valor,
}: {
  etiqueta: string
  nombre: string
  tipo?: string
  falla?: string
  ayuda?: string
  autoComplete?: string
  valor?: string
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="label block">{etiqueta}</span>
      <input
        type={tipo}
        name={nombre}
        required
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
