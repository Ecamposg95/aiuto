import { describe, it, expect } from 'vitest'
import { loQueFalta, type PerfilParaRevisar } from '../src/perfil.js'

const completo: PerfilParaRevisar = {
  titular: 'Desarrolladora backend',
  resumen: 'Seis años construyendo servicios.',
  telefono: '3312345678',
  codigoPostal: '44190',
  habilidades: ['Node.js', 'PostgreSQL'],
  ligaPortafolio: 'https://ejemplo.mx',
  ligaVideo: null,
}

const con = (cambios: Partial<PerfilParaRevisar>) => loQueFalta({ ...completo, ...cambios })

describe('loQueFalta', () => {
  it('no reclama nada cuando el perfil está completo', () => {
    expect(loQueFalta(completo)).toEqual([])
  })

  it('un video basta en lugar del portafolio: no se piden los dos', () => {
    expect(con({ ligaPortafolio: null, ligaVideo: 'https://video.mx' })).toEqual([])
    expect(con({ ligaPortafolio: null, ligaVideo: null }).map((f) => f.campo)).toContain(
      'ligaPortafolio',
    )
  })

  it('detecta los campos vacíos, incluidos los que sólo traen espacios', () => {
    expect(con({ titular: null }).map((f) => f.campo)).toContain('titular')
    expect(con({ titular: '   ' }).map((f) => f.campo)).toContain('titular')
    expect(con({ habilidades: [] }).map((f) => f.campo)).toContain('habilidades')
    expect(con({ telefono: null }).map((f) => f.campo)).toContain('telefono')
    expect(con({ codigoPostal: null }).map((f) => f.campo)).toContain('codigoPostal')
  })

  it('pone primero lo que decide si te contactan', () => {
    const vacio: PerfilParaRevisar = {
      titular: null, resumen: null, telefono: null, codigoPostal: null,
      habilidades: [], ligaPortafolio: null, ligaVideo: null,
    }
    const campos = loQueFalta(vacio).map((f) => f.campo)
    expect(campos[0]).toBe('titular')
    expect(campos.indexOf('habilidades')).toBeLessThan(campos.indexOf('codigoPostal'))
  })

  it('cada falta explica por qué importa, no sólo qué falta', () => {
    for (const f of loQueFalta({
      titular: null, resumen: null, telefono: null, codigoPostal: null,
      habilidades: [], ligaPortafolio: null, ligaVideo: null,
    })) {
      expect(f.que.length).toBeGreaterThan(3)
      expect(f.porque.length).toBeGreaterThan(20)
    }
  })
})
