'use client'

import { useActionState } from 'react'
import { crearVacante, type ResultadoAccion } from '@/lib/acciones'

type Categoria = { id: string; nombre: string }

const estadoInicial: ResultadoAccion = { ok: true }

export function FormaVacante({ categorias }: { categorias: Categoria[] }) {
  const [resultado, accion, pendiente] = useActionState(crearVacante, estadoInicial)
  const fallas = resultado.ok ? [] : resultado.fallas
  const falla = (campo: string) => fallas.find((f) => f.campo === campo)?.mensaje

  return (
    <form action={accion} className="max-w-[70ch]">
      {fallas.length > 0 && (
        <p role="alert" className="border-rule border-operaciones bg-operaciones-tint p-4 text-sm">
          Faltan {fallas.length} {fallas.length === 1 ? 'dato' : 'datos'}. Están marcados abajo.
        </p>
      )}

      <Bloque titulo="Quién y qué">
        <Campo etiqueta="Empresa" nombre="empresa" falla={falla('empresa')} requerido />
        <Selector etiqueta="Categoría" nombre="categoryId" falla={falla('categoryId')}>
          <option value="">Elige una…</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Selector>
        <Campo etiqueta="Puesto" nombre="puesto" falla={falla('puesto')} requerido />
        <Campo etiqueta="Ubicación" nombre="ubicacion" falla={falla('ubicacion')} requerido />
        <Selector etiqueta="Modalidad" nombre="modalidad" falla={falla('modalidad')}>
          <option value="PRESENCIAL">Presencial</option>
          <option value="HIBRIDO">Híbrido</option>
          <option value="REMOTO">Remoto</option>
        </Selector>
        <Area etiqueta="Descripción del puesto" nombre="descripcion" falla={falla('descripcion')} />
      </Bloque>

      <Bloque
        titulo="Transparencia"
        nota="Esto es lo que diferencia a AIUTO. Sin estos datos la vacante no se guarda."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Sueldo mínimo" nombre="sueldoMin" tipo="number" falla={falla('sueldoMin')} requerido />
          <Campo
            etiqueta="Sueldo máximo"
            nombre="sueldoMax"
            tipo="number"
            falla={falla('sueldoMax')}
            requerido
            ayuda="Si el sueldo es fijo, repite el mínimo."
          />
        </div>
        <Selector etiqueta="Periodicidad" nombre="periodicidad" falla={falla('periodicidad')}>
          <option value="MENSUAL">Mensual</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="SEMANAL">Semanal</option>
          <option value="POR_HORA">Por hora</option>
          <option value="ANUAL">Anual</option>
        </Selector>

        <div className="grid gap-4 sm:grid-cols-2">
          <Selector etiqueta="Seguro social" nombre="seguroSocial" falla={falla('seguroSocial')}>
            <option value="COMPLETO">Sobre el sueldo completo</option>
            <option value="MIXTO">Sobre una parte</option>
          </Selector>
          <Campo
            etiqueta="Porcentaje (si es mixto)"
            nombre="seguroSocialPct"
            tipo="number"
            falla={falla('seguroSocialPct')}
            ayuda="Entre 1 y 99. Se ignora si elegiste completo."
          />
        </div>

        <Area etiqueta="Prestaciones" nombre="prestaciones" falla={falla('prestaciones')} filas={3} />
        <Campo etiqueta="Horario" nombre="horario" falla={falla('horario')} requerido />
        <Campo
          etiqueta="Conocimientos requeridos"
          nombre="conocimientos"
          falla={falla('conocimientos')}
          ayuda="Separados por coma."
          requerido
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Entrevistas del proceso"
            nombre="numEntrevistas"
            tipo="number"
            falla={falla('numEntrevistas')}
            requerido
          />
          <Campo
            etiqueta="Días esperados de cierre"
            nombre="diasCierreEsperado"
            tipo="number"
            falla={falla('diasCierreEsperado')}
            ayuda="Máximo 60: es lo que vive una vacante."
            requerido
          />
        </div>
      </Bloque>

      <div className="mt-6 flex flex-wrap gap-4 border-t-rule border-ink pt-5">
        <button type="submit" name="publicar" value="si" className="btn" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Publicar ahora'}
        </button>
        <button type="submit" name="publicar" value="no" className="btn-secundario" disabled={pendiente}>
          Guardar como borrador
        </button>
      </div>
      <p className="mt-3 text-sm text-neutral">
        Al publicar, la vacante vive 60 días y después se cierra sola.
      </p>
    </form>
  )
}

function Bloque({
  titulo,
  nota,
  children,
}: {
  titulo: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <h2 className="label border-b-rule border-ink pb-2">{titulo}</h2>
      {nota && <p className="mt-3 text-sm text-ink-2">{nota}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}

function Etiqueta({
  etiqueta,
  falla,
  ayuda,
  nombre,
  children,
}: {
  etiqueta: string
  falla?: string
  ayuda?: string
  nombre: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="label block">{etiqueta}</span>
      {children}
      {ayuda && !falla && <span className="mt-1 block text-sm text-neutral">{ayuda}</span>}
      {falla && (
        <span id={`${nombre}-error`} role="alert" className="mt-1 block text-sm text-operaciones">
          {falla}
        </span>
      )}
    </label>
  )
}

function Campo({
  etiqueta,
  nombre,
  tipo = 'text',
  falla,
  ayuda,
  requerido,
}: {
  etiqueta: string
  nombre: string
  tipo?: string
  falla?: string
  ayuda?: string
  requerido?: boolean
}) {
  return (
    <Etiqueta etiqueta={etiqueta} falla={falla} ayuda={ayuda} nombre={nombre}>
      <input
        type={tipo}
        name={nombre}
        required={requerido}
        aria-invalid={falla ? true : undefined}
        aria-describedby={falla ? `${nombre}-error` : undefined}
        className={`campo mt-2 ${falla ? 'campo-error' : ''}`}
      />
    </Etiqueta>
  )
}

function Area({
  etiqueta,
  nombre,
  falla,
  filas = 5,
}: {
  etiqueta: string
  nombre: string
  falla?: string
  filas?: number
}) {
  return (
    <Etiqueta etiqueta={etiqueta} falla={falla} nombre={nombre}>
      <textarea
        name={nombre}
        rows={filas}
        aria-invalid={falla ? true : undefined}
        className={`campo mt-2 ${falla ? 'campo-error' : ''}`}
      />
    </Etiqueta>
  )
}

function Selector({
  etiqueta,
  nombre,
  falla,
  children,
}: {
  etiqueta: string
  nombre: string
  falla?: string
  children: React.ReactNode
}) {
  return (
    <Etiqueta etiqueta={etiqueta} falla={falla} nombre={nombre}>
      <select name={nombre} className={`campo mt-2 ${falla ? 'campo-error' : ''}`}>
        {children}
      </select>
    </Etiqueta>
  )
}
