import {
  correoAcusePostulacion,
  correoCambioEstado,
  correoAcuseSolicitud,
  correoAcuseAsesoria,
  correoAvisoEquipo,
  type EstadoPostulacion,
  type NivelCandidato,
  type VacanteEnCorreo,
} from '@aiuto/core'
import { enviarCorreo, enviarCorreos, correoDelEquipo, basePublica } from './correo'

/**
 * Los avisos que dispara cada cosa que pasa.
 *
 * Todo lo de aquí se invoca DESPUÉS de haber guardado, y ninguna función lanza:
 * un correo que falla no puede tumbar una postulación que ya quedó registrada.
 */

export const ligaPostulacion = (token: string) => `${basePublica()}/postulacion/${token}`
const ligaPanel = (ruta: string) => `${basePublica()}${ruta}`

export type VacanteConEmpresa = {
  puesto: string
  sueldoMin: number
  sueldoMax: number
  moneda: string
  periodicidad: VacanteEnCorreo['periodicidad']
  company: { nombre: string }
}

const paraCorreo = (v: VacanteConEmpresa): VacanteEnCorreo => ({
  puesto: v.puesto,
  empresa: v.company.nombre,
  sueldoMin: v.sueldoMin,
  sueldoMax: v.sueldoMax,
  moneda: v.moneda,
  periodicidad: v.periodicidad,
})

export async function avisarPostulacionNueva(datos: {
  nombre: string
  correo: string
  telefono?: string | null
  token: string
  vacante: VacanteConEmpresa
}) {
  const vacante = paraCorreo(datos.vacante)
  const liga = ligaPostulacion(datos.token)

  await enviarCorreo(correoAcusePostulacion({ nombre: datos.nombre, vacante, liga }), {
    correo: datos.correo,
    nombre: datos.nombre,
  })

  const equipo = correoDelEquipo()
  if (equipo) {
    await enviarCorreo(
      correoAvisoEquipo({
        titulo: 'Nueva postulación',
        detalle: `${vacante.puesto} · ${vacante.empresa}`,
        campos: [
          ['Nombre', datos.nombre],
          ['Correo', datos.correo],
          ['Teléfono', datos.telefono || 'no proporcionado'],
        ],
        liga: ligaPanel('/panel/postulaciones'),
      }),
      equipo,
    )
  }
}

export async function avisarCambioDeEstado(datos: {
  nombre: string
  correo: string
  estado: EstadoPostulacion
  token: string
  vacante: VacanteConEmpresa
}) {
  const correo = correoCambioEstado({
    nombre: datos.nombre,
    estado: datos.estado,
    vacante: paraCorreo(datos.vacante),
    liga: ligaPostulacion(datos.token),
  })
  // Hay estados que no ameritan correo; el propio armador lo decide.
  if (!correo) return
  await enviarCorreo(correo, { correo: datos.correo, nombre: datos.nombre })
}

/** Aviso en lote a quienes se quedaron sin respuesta al cerrarse una vacante. */
export async function avisarVacanteCerrada(datos: {
  vacante: VacanteConEmpresa
  destinatarios: readonly { nombre: string; correo: string; tokenConsulta: string }[]
}) {
  const vacante = paraCorreo(datos.vacante)
  const envios = datos.destinatarios.flatMap((d) => {
    const correo = correoCambioEstado({
      nombre: d.nombre,
      estado: 'VACANTE_CUBIERTA',
      vacante,
      liga: ligaPostulacion(d.tokenConsulta),
    })
    return correo ? [{ correo, a: { correo: d.correo, nombre: d.nombre } }] : []
  })

  if (envios.length === 0) return { enviados: 0, fallidos: 0 }
  return enviarCorreos(envios)
}

export async function avisarSolicitudNueva(datos: {
  nombre: string
  correo: string
  telefono?: string | null
  empresa?: string | null
  mensaje: string
  categoria?: string | null
}) {
  await enviarCorreo(correoAcuseSolicitud({ nombre: datos.nombre }), {
    correo: datos.correo,
    nombre: datos.nombre,
  })

  const equipo = correoDelEquipo()
  if (!equipo) return

  await enviarCorreo(
    correoAvisoEquipo({
      titulo: 'Nueva solicitud',
      detalle: datos.categoria ?? 'sin categoría',
      campos: [
        ['Nombre', datos.nombre],
        ['Correo', datos.correo],
        ['Teléfono', datos.telefono || 'no proporcionado'],
        ['Empresa', datos.empresa || 'no proporcionada'],
        ['Mensaje', datos.mensaje],
      ],
      liga: ligaPanel('/panel'),
    }),
    equipo,
  )
}

export async function avisarAsesoriaNueva(datos: {
  nombre: string
  correo: string
  telefono?: string | null
  nivel: NivelCandidato
  precio: number
  moneda: string
}) {
  await enviarCorreo(
    correoAcuseAsesoria({
      nombre: datos.nombre,
      nivel: datos.nivel,
      precio: datos.precio,
      moneda: datos.moneda,
    }),
    { correo: datos.correo, nombre: datos.nombre },
  )

  const equipo = correoDelEquipo()
  if (!equipo) return

  await enviarCorreo(
    correoAvisoEquipo({
      titulo: 'Nueva solicitud de asesoría',
      detalle: `$${datos.precio.toLocaleString('es-MX')} ${datos.moneda}`,
      campos: [
        ['Nombre', datos.nombre],
        ['Correo', datos.correo],
        ['Teléfono', datos.telefono || 'no proporcionado'],
        ['Nivel', datos.nivel],
      ],
      liga: ligaPanel('/panel/asesorias'),
    }),
    equipo,
  )
}
