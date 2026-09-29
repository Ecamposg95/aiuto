/**
 * Datos de DESARROLLO. No son vacantes reales.
 *
 * Existen sólo para poder ver y probar las pantallas mientras se construyen. La
 * beta abre con vacantes reales capturadas por el equipo AIUTO: antes de abrirla
 * hay que correr esto con `--limpiar`.
 *
 *   pnpm db:seed:dev              siembra
 *   pnpm db:seed:dev --limpiar    borra todo lo sembrado aquí
 */
import { PrismaClient, type Prisma } from '../generated/client/index.js'

const prisma = new PrismaClient()

/** Marca que identifica lo sembrado aquí, para poder retirarlo sin tocar lo real. */
const MARCA_DEV = 'dev-'

const EMPRESAS = [
  { slug: `${MARCA_DEV}norte-logistica`, nombre: 'Norte Logística', ubicacion: 'Monterrey, Nuevo León' },
  { slug: `${MARCA_DEV}grupo-serena`, nombre: 'Grupo Serena', ubicacion: 'Guadalajara, Jalisco' },
  { slug: `${MARCA_DEV}consultoria-bajio`, nombre: 'Consultoría Bajío', ubicacion: 'Querétaro, Querétaro' },
]

const VACANTES: (Omit<Prisma.VacanteCreateManyInput, 'companyId' | 'categoryId'> & {
  empresa: string
  categoria: string
})[] = [
  {
    empresa: `${MARCA_DEV}norte-logistica`,
    categoria: 'comex',
    slug: `${MARCA_DEV}coordinador-comercio-exterior`,
    puesto: 'Coordinador de comercio exterior',
    descripcion:
      'Coordinar importaciones y exportaciones, tratar con agentes aduanales y mantener la documentación en regla. Reporta a la dirección de operaciones.',
    ubicacion: 'Monterrey, Nuevo León',
    modalidad: 'HIBRIDO',
    sueldoMin: 32000,
    sueldoMax: 38000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, fondo de ahorro, 15 días de aguinaldo.',
    horario: 'Lunes a viernes, 8:00 a 17:00. Dos días en casa.',
    conocimientos: ['INCOTERMS', 'Pedimentos', 'SAP', 'Inglés intermedio'],
    numEntrevistas: 2,
    diasCierreEsperado: 30,
    estado: 'ABIERTA',
  },
  {
    empresa: `${MARCA_DEV}grupo-serena`,
    categoria: 'tecnologia',
    slug: `${MARCA_DEV}desarrollador-backend`,
    puesto: 'Desarrollador backend',
    descripcion:
      'Construir y mantener los servicios que sostienen la plataforma interna. Node y PostgreSQL. Equipo de cuatro personas.',
    ubicacion: 'Guadalajara, Jalisco',
    modalidad: 'REMOTO',
    sueldoMin: 45000,
    sueldoMax: 60000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO',
    seguroSocialPct: 60,
    prestaciones: 'Ley, seguro de gastos médicos mayores, 20 días de vacaciones.',
    horario: 'Flexible, con traslape de 10:00 a 15:00.',
    conocimientos: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker'],
    numEntrevistas: 3,
    diasCierreEsperado: 45,
    estado: 'ABIERTA',
  },
  {
    empresa: `${MARCA_DEV}consultoria-bajio`,
    categoria: 'capital-humano',
    slug: `${MARCA_DEV}especialista-atraccion-talento`,
    puesto: 'Especialista en atracción de talento',
    descripcion:
      'Llevar procesos de reclutamiento de punta a punta para clientes del Bajío, principalmente manufactura.',
    ubicacion: 'Querétaro, Querétaro',
    modalidad: 'PRESENCIAL',
    sueldoMin: 24000,
    sueldoMax: 24000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, comedor, transporte de personal.',
    horario: 'Lunes a viernes, 9:00 a 18:00.',
    conocimientos: ['Reclutamiento', 'Entrevista por competencias', 'ATS'],
    numEntrevistas: 2,
    diasCierreEsperado: 21,
    estado: 'ABIERTA',
  },
]

const DIAS_VIGENCIA = 60

async function limpiar() {
  const empresas = await prisma.company.findMany({
    where: { slug: { startsWith: MARCA_DEV } },
    select: { id: true },
  })
  const ids = empresas.map((e) => e.id)
  // Las vacantes y sus postulaciones caen en cascada con la empresa.
  const { count } = await prisma.company.deleteMany({ where: { id: { in: ids } } })
  console.log(`Empresas de desarrollo retiradas: ${count}`)
}

async function sembrar() {
  const categorias = await prisma.category.findMany()
  const porSlug = new Map(categorias.map((c) => [c.slug, c.id]))

  for (const e of EMPRESAS) {
    await prisma.company.upsert({
      where: { slug: e.slug },
      create: { slug: e.slug, nombre: e.nombre, ubicacion: e.ubicacion, verificada: true },
      update: { nombre: e.nombre, ubicacion: e.ubicacion },
    })
  }

  const publicadaEn = new Date()
  const expiraEn = new Date(publicadaEn)
  expiraEn.setUTCDate(expiraEn.getUTCDate() + DIAS_VIGENCIA)

  for (const { empresa, categoria, ...v } of VACANTES) {
    const company = await prisma.company.findUniqueOrThrow({ where: { slug: empresa } })
    const categoryId = porSlug.get(categoria)
    if (!categoryId) throw new Error(`Falta la categoría ${categoria}; corre primero la semilla base.`)

    await prisma.vacante.upsert({
      where: { slug: v.slug! },
      create: { ...v, companyId: company.id, categoryId, publicadaEn, expiraEn },
      update: { ...v, companyId: company.id, categoryId, publicadaEn, expiraEn },
    })
  }

  console.log(`Vacantes de desarrollo sembradas: ${VACANTES.length}`)
  console.log('NO son reales. Antes de abrir la beta: pnpm db:seed:dev --limpiar')
}

const main = process.argv.includes('--limpiar') ? limpiar : sembrar

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
