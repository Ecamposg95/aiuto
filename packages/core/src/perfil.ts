/**
 * Qué le falta a un perfil para que sirva.
 *
 * Deliberadamente NO es un porcentaje. Un «perfil 60 % completo» no le dice a
 * nadie qué hacer, y el número sale de una ponderación que alguien se inventó.
 * Es más honesto y más útil nombrar lo que falta y por qué importa.
 *
 * El orden es el de impacto real: primero lo que decide si a alguien lo
 * contactan, al final lo que sólo ayuda.
 */

export type PerfilParaRevisar = {
  titular: string | null
  resumen: string | null
  telefono: string | null
  codigoPostal: string | null
  habilidades: string[]
  ligaPortafolio: string | null
  ligaVideo: string | null
}

export type Falta = { campo: string; que: string; porque: string }

const vacio = (v: string | null | undefined) => !v || v.trim().length === 0

export function loQueFalta(p: PerfilParaRevisar): Falta[] {
  const faltas: Falta[] = []

  if (vacio(p.titular)) {
    faltas.push({
      campo: 'titular',
      que: 'Cómo te describes',
      porque: 'Es la primera línea que lee quien revisa. Sin ella, tu perfil no dice a qué te dedicas.',
    })
  }

  if (p.habilidades.length === 0) {
    faltas.push({
      campo: 'habilidades',
      que: 'Tus habilidades',
      porque: 'Es con lo que te encontramos cuando entra una vacante que empata contigo.',
    })
  }

  if (vacio(p.telefono)) {
    faltas.push({
      campo: 'telefono',
      que: 'Un teléfono',
      porque: 'Cuando hay prisa por agendar una entrevista, el correo tarda.',
    })
  }

  if (vacio(p.resumen)) {
    faltas.push({
      campo: 'resumen',
      que: 'Un párrafo sobre ti',
      porque: 'Un renglón de contexto cambia cómo se lee el resto.',
    })
  }

  if (vacio(p.codigoPostal)) {
    faltas.push({
      campo: 'codigoPostal',
      que: 'Tu código postal',
      porque: 'Sirve para decirte qué tan lejos te queda una vacante. No guardamos tu domicilio.',
    })
  }

  // Portafolio o video: cualquiera de los dos cuenta. Pedir los dos sería
  // inventar trabajo; lo que importa es que haya algo que mirar.
  if (vacio(p.ligaPortafolio) && vacio(p.ligaVideo)) {
    faltas.push({
      campo: 'ligaPortafolio',
      que: 'Algo que podamos ver',
      porque: 'Un portafolio o un video se revisa distinto que una lista de habilidades.',
    })
  }

  return faltas
}
