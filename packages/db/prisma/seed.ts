/**
 * Semilla. Idempotente: se puede correr cuantas veces haga falta.
 *
 * Las siete categorías son la única semilla fija del sistema y salen de
 * `sitio/categorias.json`, que es la fuente que ya usa la landing. Se leen de ahí
 * en vez de copiarlas para que no se desincronicen.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from '../generated/client/index.js'

const prisma = new PrismaClient()
const aqui = dirname(fileURLToPath(import.meta.url))
const CATEGORIAS = resolve(aqui, '../../../sitio/categorias.json')

type CategoriaLanding = {
  slug: string
  name: string
  short: string
  color: string
  dark: string
  tint: string
  desc: string
}

async function main() {
  const crudo = await readFile(CATEGORIAS, 'utf8')
  const categorias = JSON.parse(crudo) as CategoriaLanding[]

  if (categorias.length !== 7) {
    throw new Error(
      `Se esperaban 7 categorías en sitio/categorias.json y vinieron ${categorias.length}.`,
    )
  }

  for (const [i, c] of categorias.entries()) {
    const datos = {
      nombre: c.name,
      corto: c.short,
      descripcion: c.desc,
      color: c.color,
      colorDark: c.dark,
      colorTint: c.tint,
      orden: i,
    }
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...datos },
      update: datos,
    })
  }

  console.log(`Categorías sembradas: ${categorias.length}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
