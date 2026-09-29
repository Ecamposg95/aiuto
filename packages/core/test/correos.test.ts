import { describe, it, expect } from 'vitest'
import {
  correoAcusePostulacion,
  correoCambioEstado,
  correoAvisoEquipo,
  correoAcuseSolicitud,
  correoAcuseAsesoria,
  ESTADOS_QUE_AVISAN,
} from '../src/correos.js'

const VACANTE = {
  puesto: 'Ingeniera de plataforma',
  empresa: 'Nube Verde',
  sueldoMin: 70000,
  sueldoMax: 95000,
  moneda: 'MXN',
  periodicidad: 'MENSUAL' as const,
}

const LIGA = 'https://app.aiuto.com.mx/postulacion/abc123'

describe('acuse de postulación', () => {
  const c = correoAcusePostulacion({ nombre: 'Carla', vacante: VACANTE, liga: LIGA })

  it('nombra el puesto en el asunto, para que se reconozca en la bandeja', () => {
    expect(c.asunto).toContain('Ingeniera de plataforma')
  })

  it('incluye la liga de seguimiento en las dos versiones', () => {
    expect(c.texto).toContain(LIGA)
    expect(c.html).toContain(LIGA)
  })

  it('saluda por nombre', () => {
    expect(c.texto).toContain('Carla')
  })

  it('repite el sueldo publicado: es el compromiso de la vacante', () => {
    expect(c.texto).toContain('$70,000 – $95,000 MXN mensuales')
  })

  it('siempre trae versión de texto plano', () => {
    expect(c.texto.length).toBeGreaterThan(50)
    expect(c.texto).not.toContain('<')
  })
})

describe('aviso de cambio de estado', () => {
  it('avisa en los estados que le importan al candidato', () => {
    for (const estado of ESTADOS_QUE_AVISAN) {
      const c = correoCambioEstado({ nombre: 'Beto', estado, vacante: VACANTE, liga: LIGA })
      expect(c, `falta correo para ${estado}`).not.toBeNull()
      expect(c!.texto).toContain(LIGA)
    }
  })

  it('no manda correo al recibir: para eso está el acuse', () => {
    expect(correoCambioEstado({ nombre: 'Beto', estado: 'RECIBIDA', vacante: VACANTE, liga: LIGA })).toBeNull()
  })

  it('dice las malas noticias sin rodeos', () => {
    const c = correoCambioEstado({ nombre: 'Eva', estado: 'RECHAZADA', vacante: VACANTE, liga: LIGA })!
    expect(c.texto.toLowerCase()).toContain('no seguimos')
  })

  it('cuando la vacante se cubre, lo dice sin culpar a nadie', () => {
    const c = correoCambioEstado({ nombre: 'Fer', estado: 'VACANTE_CUBIERTA', vacante: VACANTE, liga: LIGA })!
    expect(c.asunto).toContain('Ingeniera de plataforma')
    expect(c.texto.toLowerCase()).toContain('se cubrió')
  })

  it('felicita al contratar', () => {
    const c = correoCambioEstado({ nombre: 'Dani', estado: 'CONTRATADA', vacante: VACANTE, liga: LIGA })!
    expect(c.texto.toLowerCase()).toContain('felicidades')
  })
})

describe('avisos al equipo', () => {
  it('resume en el asunto para que se ordene la bandeja', () => {
    const c = correoAvisoEquipo({
      titulo: 'Nueva postulación',
      detalle: 'Ingeniera de plataforma',
      campos: [['Nombre', 'Carla'], ['Correo', 'carla@ejemplo.mx']],
      liga: 'https://app.aiuto.com.mx/panel/postulaciones',
    })
    expect(c.asunto).toContain('Nueva postulación')
    expect(c.asunto).toContain('Ingeniera de plataforma')
    expect(c.texto).toContain('carla@ejemplo.mx')
    expect(c.texto).toContain('/panel/postulaciones')
  })
})

describe('acuses de solicitudes', () => {
  it('el de contacto no promete tiempos que no podemos cumplir', () => {
    const c = correoAcuseSolicitud({ nombre: 'Marco' })
    expect(c.texto).toContain('Marco')
    expect(c.texto).not.toMatch(/24 horas|48 horas/)
  })

  it('el de asesoría repite el precio que la persona vio', () => {
    const c = correoAcuseAsesoria({ nombre: 'Iris', nivel: 'ESTUDIANTE', precio: 2500, moneda: 'MXN' })
    expect(c.texto).toContain('$2,500 MXN')
    expect(c.texto.toLowerCase()).toContain('no se te ha cobrado')
  })
})

describe('todos los correos', () => {
  const todos = [
    correoAcusePostulacion({ nombre: 'A', vacante: VACANTE, liga: LIGA }),
    correoCambioEstado({ nombre: 'A', estado: 'ENTREVISTA', vacante: VACANTE, liga: LIGA })!,
    correoAcuseSolicitud({ nombre: 'A' }),
    correoAcuseAsesoria({ nombre: 'A', nivel: 'GERENCIA', precio: 5000, moneda: 'MXN' }),
  ]

  it('traen asunto, texto y html', () => {
    for (const c of todos) {
      expect(c.asunto.length).toBeGreaterThan(5)
      expect(c.texto.length).toBeGreaterThan(30)
      expect(c.html).toContain('<')
    }
  })

  it('no dejan marcadores sin sustituir', () => {
    for (const c of todos) {
      expect(c.asunto + c.texto + c.html).not.toMatch(/\{\{|\}\}|undefined|\[PENDIENTE\]/)
    }
  })

  it('firman como AIUTO', () => {
    for (const c of todos) expect(c.texto).toContain('AIUTO')
  })
})
