/**
 * Semilla. Idempotente: se puede correr cuantas veces haga falta.
 *
 * Las siete categorías son la única semilla fija del sistema y salen de
 * `packages/core/src/soluciones.ts`, la misma fuente de las páginas públicas.
 * Se leen de ahí en vez de copiarlas para que no se desincronicen.
 */
import { PrismaClient } from '../generated/client/index.js'
import { VERTICALES } from '../../core/src/soluciones.js'

const prisma = new PrismaClient()

async function main() {
  if (VERTICALES.length !== 7) {
    throw new Error(`Se esperaban 7 categorías y vinieron ${VERTICALES.length}.`)
  }

  for (const [i, c] of VERTICALES.entries()) {
    const datos = {
      nombre: c.nombre,
      corto: c.corto,
      descripcion: c.lema,
      color: c.color,
      colorDark: c.colorDark,
      colorTint: c.colorTint,
      orden: i,
    }
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...datos },
      update: datos,
    })
  }

  console.log(`Categorías sembradas: ${VERTICALES.length}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
