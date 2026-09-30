'use client'

import { useActionState } from 'react'
import { guardarPerfil, type EstadoPerfil } from './accion'

type Perfil = {
  titular: string | null
  resumen: string | null
  nivel: string
  anosExperiencia: number
  telefono: string | null
  codigoPostal: string | null
  habilidades: string[]
  ligaPortafolio: string | null
  ligaVideo: string | null
  disponibilidad: string | null
  rosterPreferencial: boolean
}

const inicial: EstadoPerfil = {}

export function FormaPerfil({ perfil }: { perfil: Perfil }) {
  const [estado, accion, pendiente] = useActionState(guardarPerfil, inicial)
  const falla = (c: string) => estado.fallas?.find((f) => f.campo === c)?.mensaje

  /**
   * Lo que se pinta en cada campo: lo que la persona acaba de escribir si la
   * accion lo devolvio, y si no, lo que hay guardado. Sin esto un error de
   * validacion borra todo lo capturado.
   */
  const valor = (campo: string, guardado: string) => estado.valores?.[campo] ?? guardado

  // Mismo motivo que en la forma de vacante: el <select> de nivel no vuelve a
  // aplicar `defaultValue` en un re-render y perderia lo elegido.
  const llave = estado.intento ?? 0

  return (
    <form action={accion} key={llave}>
      {estado.guardado && !estado.fallas && (
        <p role="status" className="border-rule border-ink bg-off p-4 text-sm">
          Guardado.
        </p>
      )}

      <section className="mt-6">
        <h2 className="label border-b-rule border-ink pb-2">Lo básico</h2>
        <div className="mt-4 grid gap-4">
          <Campo
            etiqueta="Cómo te describes"
            nombre="titular"
            valor={valor('titular', perfil.titular ?? '')}
            falla={falla('titular')}
            ayuda="Una línea: «Desarrolladora backend», «Soldador certificado»."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector etiqueta="En qué momento estás" nombre="nivel" valor={valor('nivel', perfil.nivel)} falla={falla('nivel')}>
              <option value="ESTUDIANTE">Estudiante o recién egresado</option>
              <option value="EXPERIMENTADO">Con experiencia</option>
              <option value="GERENCIA">Gerencia o dirección</option>
            </Selector>
            <Campo
              etiqueta="Años de experiencia"
              nombre="anosExperiencia"
              tipo="number"
              valor={valor('anosExperiencia', String(perfil.anosExperiencia))}
              falla={falla('anosExperiencia')}
            />
          </div>
          <Area
            etiqueta="Un párrafo sobre ti"
            nombre="resumen"
            valor={valor('resumen', perfil.resumen ?? '')}
            falla={falla('resumen')}
          />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="label border-b-rule border-ink pb-2">Cómo contactarte</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo
            etiqueta="Teléfono"
            nombre="telefono"
            tipo="tel"
            valor={valor('telefono', perfil.telefono ?? '')}
            falla={falla('telefono')}
          />
          <Campo
            etiqueta="Código postal"
            nombre="codigoPostal"
            valor={valor('codigoPostal', perfil.codigoPostal ?? '')}
            falla={falla('codigoPostal')}
            ayuda="Sólo el CP. Sirve para decirte qué tan lejos te queda una vacante; no guardamos tu domicilio."
          />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="label border-b-rule border-ink pb-2">Lo que sabes hacer</h2>
        <div className="mt-4 grid gap-4">
          <Campo
            etiqueta="Habilidades"
            nombre="habilidades"
            valor={valor('habilidades', perfil.habilidades.join(', '))}
            falla={falla('habilidades')}
            ayuda="Separadas por coma."
          />
          <Campo
            etiqueta="Portafolio o repositorio"
            nombre="ligaPortafolio"
            tipo="url"
            valor={valor('ligaPortafolio', perfil.ligaPortafolio ?? '')}
            falla={falla('ligaPortafolio')}
            ayuda="Opcional. Un perfil con muestras de trabajo se revisa distinto."
          />
          <Campo
            etiqueta="Video de presentación"
            nombre="ligaVideo"
            tipo="url"
            valor={valor('ligaVideo', perfil.ligaVideo ?? '')}
            falla={falla('ligaVideo')}
            ayuda="Opcional. Pégala de donde ya lo tengas alojado."
          />
          <Campo
            etiqueta="Disponibilidad"
            nombre="disponibilidad"
            valor={valor('disponibilidad', perfil.disponibilidad ?? '')}
            falla={falla('disponibilidad')}
            ayuda="«Inmediata», «dos semanas», lo que aplique."
          />
        </div>
      </section>

      <button type="submit" className="btn mt-6" disabled={pendiente}>
        {pendiente ? 'Guardando…' : 'Guardar perfil'}
      </button>
    </form>
  )
}

function Envoltura({
  etiqueta,
  nombre,
  falla,
  ayuda,
  children,
}: {
  etiqueta: string
  nombre: string
  falla?: string
  ayuda?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="label block">{etiqueta}</span>
      {children}
      {ayuda && !falla && <span className="mt-1 block text-sm text-neutral">{ayuda}</span>}
      {falla && (
        <span role="alert" className="mt-1 block text-sm text-operaciones">
          {falla}
        </span>
      )}
    </label>
  )
}

function Campo(p: {
  etiqueta: string
  nombre: string
  valor: string
  tipo?: string
  falla?: string
  ayuda?: string
}) {
  return (
    <Envoltura etiqueta={p.etiqueta} nombre={p.nombre} falla={p.falla} ayuda={p.ayuda}>
      <input
        type={p.tipo ?? 'text'}
        name={p.nombre}
        defaultValue={p.valor}
        aria-invalid={p.falla ? true : undefined}
        className={`campo mt-2 ${p.falla ? 'campo-error' : ''}`}
      />
    </Envoltura>
  )
}

function Area(p: { etiqueta: string; nombre: string; valor: string; falla?: string }) {
  return (
    <Envoltura etiqueta={p.etiqueta} nombre={p.nombre} falla={p.falla}>
      <textarea
        name={p.nombre}
        rows={4}
        defaultValue={p.valor}
        className={`campo mt-2 ${p.falla ? 'campo-error' : ''}`}
      />
    </Envoltura>
  )
}

function Selector(p: {
  etiqueta: string
  nombre: string
  valor: string
  falla?: string
  children: React.ReactNode
}) {
  return (
    <Envoltura etiqueta={p.etiqueta} nombre={p.nombre} falla={p.falla}>
      <select name={p.nombre} defaultValue={p.valor} className="campo mt-2">
        {p.children}
      </select>
    </Envoltura>
  )
}
