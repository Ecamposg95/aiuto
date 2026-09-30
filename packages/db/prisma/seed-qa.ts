/**
 * Datos de QA. NO son reales y NO deben existir cuando abra la beta.
 *
 * Cubre a propósito todos los estados de cada entidad, para poder recorrer cada
 * pantalla sin tener que fabricar el caso a mano: vacantes en los cinco estados
 * (incluida una a punto de vencer y otra ya vencida), postulaciones en los seis,
 * solicitudes y asesorías en todos los suyos, y una cuenta por cada tipo de
 * usuario.
 *
 *   pnpm db:seed:qa              siembra
 *   pnpm db:seed:qa --limpiar    retira todo lo de aquí
 *
 * Las contraseñas son fijas y están escritas en claro justamente porque son de
 * QA: si alguna sirve en la beta, es que este seed se corrió donde no debía.
 */
import bcrypt from 'bcryptjs'
import { PrismaClient, type Prisma } from '../generated/client/index.js'

const prisma = new PrismaClient()

/** Todo lo sembrado aquí es reconocible por esto, para poder retirarlo entero. */
const MARCA = 'qa-'
const DOMINIO_QA = '@qa.aiuto.test'
const PASSWORD_QA = 'aiuto123'

const DIA = 24 * 60 * 60 * 1000
const hace = (dias: number) => new Date(Date.now() - dias * DIA)
const dentroDe = (dias: number) => new Date(Date.now() + dias * DIA)

// --------------------------------------------------------------- usuarios

const USUARIOS = [
  { correo: `admin${DOMINIO_QA}`, nombre: 'Ana Admin (QA)', rol: 'STAFF_ADMIN' },
  { correo: `operador${DOMINIO_QA}`, nombre: 'Omar Operador (QA)', rol: 'STAFF_OPERADOR' },
  { correo: `candidato${DOMINIO_QA}`, nombre: 'Carla Candidata (QA)', rol: 'CANDIDATO' },
  { correo: `egresado${DOMINIO_QA}`, nombre: 'Efrén Egresado (QA)', rol: 'CANDIDATO' },
  { correo: `gerente${DOMINIO_QA}`, nombre: 'Gina Gerente (QA)', rol: 'CANDIDATO' },
] as const

/** Perfiles de candidato, uno por nivel, para probar el filtrado y el roster. */
const PERFILES = [
  {
    correo: `candidato${DOMINIO_QA}`,
    titular: 'Desarrolladora backend',
    nivel: 'EXPERIMENTADO',
    anosExperiencia: 6,
    codigoPostal: '44100',
    habilidades: ['Node.js', 'PostgreSQL', 'AWS'],
    rosterPreferencial: true,
  },
  {
    correo: `egresado${DOMINIO_QA}`,
    titular: 'Pasante de ingeniería industrial',
    nivel: 'ESTUDIANTE',
    anosExperiencia: 0,
    codigoPostal: '64000',
    habilidades: ['Excel', 'Lean'],
    rosterPreferencial: false,
  },
  {
    correo: `gerente${DOMINIO_QA}`,
    titular: 'Directora de operaciones',
    nivel: 'GERENCIA',
    anosExperiencia: 15,
    codigoPostal: '06000',
    habilidades: ['P&L', 'Cadena de suministro', 'Gestión de equipos'],
    rosterPreferencial: true,
  },
] as const

// --------------------------------------------------------------- empresas

const EMPRESAS = [
  { slug: `${MARCA}metalurgica-bajio`, nombre: 'Metalúrgica Bajío (QA)', ubicacion: 'León, Guanajuato' },
  { slug: `${MARCA}nube-verde`, nombre: 'Nube Verde (QA)', ubicacion: 'Ciudad de México' },
  { slug: `${MARCA}logistica-istmo`, nombre: 'Logística del Istmo (QA)', ubicacion: 'Veracruz, Veracruz' },
]

// --------------------------------------------------------------- vacantes

type SemillaVacante = {
  slug: string
  empresa: string
  categoria: string
  puesto: string
  descripcion: string
  ubicacion: string
  modalidad: 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO'
  sueldoMin: number
  sueldoMax: number
  periodicidad: 'POR_HORA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'ANUAL'
  seguroSocial: 'COMPLETO' | 'MIXTO'
  seguroSocialPct: number
  prestaciones: string
  horario: string
  conocimientos: string[]
  numEntrevistas: number
  diasCierreEsperado: number
  estado: 'BORRADOR' | 'ABIERTA' | 'CUBIERTA' | 'CERRADA' | 'EXPIRADA'
  /** Días desde que se publicó. null = nunca se publicó. */
  publicadaHace: number | null
  /** Días que le quedan. Negativo = ya venció. */
  venceEn: number | null
}

const VACANTES: SemillaVacante[] = [
  {
    slug: `${MARCA}soldador-certificado`,
    empresa: `${MARCA}metalurgica-bajio`,
    categoria: 'operaciones',
    puesto: 'Soldador certificado',
    descripcion: 'Soldadura MIG y TIG en línea de producción. Turno fijo, sin rotación.',
    ubicacion: 'León, Guanajuato',
    modalidad: 'PRESENCIAL',
    sueldoMin: 18000,
    sueldoMax: 22000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, comedor subsidiado, transporte de personal, bono de asistencia.',
    horario: 'Lunes a viernes, 7:00 a 16:30.',
    conocimientos: ['Soldadura MIG', 'Soldadura TIG', 'Lectura de planos'],
    numEntrevistas: 1,
    diasCierreEsperado: 15,
    estado: 'ABIERTA',
    publicadaHace: 3,
    venceEn: 57,
  },
  {
    slug: `${MARCA}ingeniera-plataforma`,
    empresa: `${MARCA}nube-verde`,
    categoria: 'tecnologia',
    puesto: 'Ingeniera de plataforma',
    descripcion:
      'Mantener la infraestructura sobre la que corren los equipos de producto. Kubernetes, Terraform y mucho trabajo de fondo.',
    ubicacion: 'Ciudad de México',
    modalidad: 'REMOTO',
    sueldoMin: 70000,
    sueldoMax: 95000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO',
    seguroSocialPct: 40,
    prestaciones: 'Ley, seguro de gastos médicos mayores, 25 días de vacaciones, presupuesto de equipo.',
    horario: 'Flexible, con traslape de 11:00 a 16:00.',
    conocimientos: ['Kubernetes', 'Terraform', 'Go', 'Observabilidad'],
    numEntrevistas: 4,
    diasCierreEsperado: 50,
    estado: 'ABIERTA',
    publicadaHace: 48,
    // A punto de vencer: sirve para ver el aviso en rojo de "quedan pocos días".
    venceEn: 6,
  },
  {
    slug: `${MARCA}auxiliar-almacen`,
    empresa: `${MARCA}logistica-istmo`,
    categoria: 'comex',
    puesto: 'Auxiliar de almacén',
    descripcion: 'Recibo, acomodo y surtido de mercancía de importación.',
    ubicacion: 'Veracruz, Veracruz',
    modalidad: 'PRESENCIAL',
    sueldoMin: 280,
    sueldoMax: 280,
    periodicidad: 'POR_HORA',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa.',
    horario: 'Turnos rotativos de 8 horas, seis días.',
    conocimientos: ['Manejo de montacargas', 'Inventarios'],
    numEntrevistas: 1,
    diasCierreEsperado: 10,
    estado: 'ABIERTA',
    publicadaHace: 10,
    venceEn: 50,
  },
  {
    slug: `${MARCA}analista-nomina`,
    empresa: `${MARCA}metalurgica-bajio`,
    categoria: 'capital-humano',
    puesto: 'Analista de nómina',
    descripcion: 'Cálculo de nómina semanal y atención a incidencias del personal de planta.',
    ubicacion: 'León, Guanajuato',
    modalidad: 'HIBRIDO',
    sueldoMin: 26000,
    sueldoMax: 30000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, fondo de ahorro, 16 días de aguinaldo.',
    horario: 'Lunes a viernes, 9:00 a 18:00. Dos días en casa.',
    conocimientos: ['Nóminas', 'IMSS', 'Excel avanzado'],
    numEntrevistas: 2,
    diasCierreEsperado: 25,
    // Borrador: sirve para probar el botón de publicar del panel.
    estado: 'BORRADOR',
    publicadaHace: null,
    venceEn: null,
  },
  {
    slug: `${MARCA}contador-general`,
    empresa: `${MARCA}nube-verde`,
    categoria: 'finanzas',
    puesto: 'Contador general',
    descripcion: 'Cierre mensual, conciliaciones y trato con el despacho externo.',
    ubicacion: 'Ciudad de México',
    modalidad: 'HIBRIDO',
    sueldoMin: 45000,
    sueldoMax: 55000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO',
    seguroSocialPct: 100,
    prestaciones: 'Ley, seguro de gastos médicos mayores.',
    horario: 'Lunes a viernes, 9:00 a 18:00.',
    conocimientos: ['Contabilidad', 'CFDI', 'Conciliaciones'],
    numEntrevistas: 3,
    diasCierreEsperado: 40,
    // Ya se cubrió: sus postulaciones deben verse cerradas en cascada.
    estado: 'CUBIERTA',
    publicadaHace: 35,
    venceEn: 25,
  },
  {
    slug: `${MARCA}coordinador-marketing`,
    empresa: `${MARCA}nube-verde`,
    categoria: 'comercial',
    puesto: 'Coordinador de marketing',
    descripcion: 'Campañas de adquisición y contenido para el canal digital.',
    ubicacion: 'Ciudad de México',
    modalidad: 'REMOTO',
    sueldoMin: 35000,
    sueldoMax: 42000,
    periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO',
    seguroSocialPct: 70,
    prestaciones: 'Ley, 20 días de vacaciones.',
    horario: 'Flexible.',
    conocimientos: ['SEO', 'Analítica', 'Contenido'],
    numEntrevistas: 2,
    diasCierreEsperado: 30,
    // Vencida: la tarea de cierre automático ya la habría marcado.
    estado: 'EXPIRADA',
    publicadaHace: 70,
    venceEn: -10,
  },
] as const

// --------------------------------------------------------------- limpieza

async function limpiar() {
  const empresas = await prisma.company.findMany({
    where: { slug: { startsWith: MARCA } },
    select: { id: true },
  })
  // Vacantes y postulaciones caen en cascada con la empresa.
  const e = await prisma.company.deleteMany({ where: { id: { in: empresas.map((x) => x.id) } } })
  const u = await prisma.user.deleteMany({ where: { email: { endsWith: DOMINIO_QA } } })
  const s = await prisma.solicitud.deleteMany({ where: { correo: { endsWith: DOMINIO_QA } } })
  const a = await prisma.solicitudAsesoria.deleteMany({ where: { correo: { endsWith: DOMINIO_QA } } })

  console.log(
    `Retirado: ${e.count} empresas, ${u.count} usuarios, ${s.count} solicitudes, ${a.count} asesorías.`,
  )
}

// --------------------------------------------------------------- siembra

async function sembrar() {
  const categorias = await prisma.category.findMany()
  if (categorias.length === 0) {
    throw new Error('No hay categorías. Corre primero `pnpm db:seed`.')
  }
  const porSlug = new Map(categorias.map((c) => [c.slug, c.id]))
  const passwordHash = await bcrypt.hash(PASSWORD_QA, 10)

  // --- usuarios ---
  // Todos llevan contraseña, incluidos los candidatos: ya pueden entrar a /mi.
  for (const u of USUARIOS) {
    const datos = { nombre: u.nombre, rol: u.rol, passwordHash }
    await prisma.user.upsert({
      where: { email: u.correo },
      create: { email: u.correo, emailVerified: new Date(), ...datos },
      update: datos,
    })
  }

  for (const p of PERFILES) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: p.correo } })
    const datos = {
      titular: p.titular,
      nivel: p.nivel,
      anosExperiencia: p.anosExperiencia,
      codigoPostal: p.codigoPostal,
      habilidades: [...p.habilidades],
      rosterPreferencial: p.rosterPreferencial,
      validadoEn: p.rosterPreferencial ? hace(20) : null,
    } satisfies Prisma.CandidateProfileUpdateInput

    await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...datos },
      update: datos,
    })
  }

  // --- empresas ---
  for (const e of EMPRESAS) {
    await prisma.company.upsert({
      where: { slug: e.slug },
      create: { ...e, verificada: true },
      update: { nombre: e.nombre, ubicacion: e.ubicacion },
    })
  }

  // --- vacantes ---
  for (const v of VACANTES) {
    const { empresa, categoria, publicadaHace, venceEn, ...campos } = v
    const company = await prisma.company.findUniqueOrThrow({ where: { slug: empresa } })
    const categoryId = porSlug.get(categoria)
    if (!categoryId) throw new Error(`Falta la categoría ${categoria}.`)

    const datos = {
      ...campos,
      conocimientos: [...campos.conocimientos],
      companyId: company.id,
      categoryId,
      publicadaEn: publicadaHace === null ? null : hace(publicadaHace),
      expiraEn: venceEn === null ? null : dentroDe(venceEn),
      cerradaEn: campos.estado === 'CUBIERTA' || campos.estado === 'EXPIRADA' ? hace(1) : null,
    }

    await prisma.vacante.upsert({
      where: { slug: v.slug },
      create: datos,
      update: datos,
    })
  }

  // --- postulaciones: una por cada estado posible ---
  const abierta = await prisma.vacante.findUniqueOrThrow({
    where: { slug: `${MARCA}ingeniera-plataforma` },
  })
  const cubierta = await prisma.vacante.findUniqueOrThrow({
    where: { slug: `${MARCA}contador-general` },
  })
  const perfilCarla = await prisma.candidateProfile.findFirst({
    where: { user: { email: `candidato${DOMINIO_QA}` } },
  })
  const perfilEfren = await prisma.candidateProfile.findFirst({
    where: { user: { email: `egresado${DOMINIO_QA}` } },
  })

  const POSTULACIONES = [
    { vacanteId: abierta.id, nombre: 'Rosa Nueva (QA)', correo: `p1${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 1 },
    { vacanteId: abierta.id, nombre: 'Beto Revisión (QA)', correo: `p2${DOMINIO_QA}`, estado: 'EN_REVISION', dias: 4 },
    {
      vacanteId: abierta.id,
      nombre: 'Carla Candidata (QA)',
      correo: `candidato${DOMINIO_QA}`,
      estado: 'ENTREVISTA',
      dias: 8,
      candidateProfileId: perfilCarla?.id,
    },
    { vacanteId: cubierta.id, nombre: 'Dani Contratada (QA)', correo: `p4${DOMINIO_QA}`, estado: 'CONTRATADA', dias: 25 },
    { vacanteId: cubierta.id, nombre: 'Eva Rechazada (QA)', correo: `p5${DOMINIO_QA}`, estado: 'RECHAZADA', dias: 22 },
    { vacanteId: cubierta.id, nombre: 'Fer Sin Suerte (QA)', correo: `p6${DOMINIO_QA}`, estado: 'VACANTE_CUBIERTA', dias: 20 },
    // Efrén ve el caso incómodo desde su propia cuenta; Gina se queda sin nada
    // a propósito, para poder mirar el estado vacío de /mi.
    {
      vacanteId: abierta.id,
      nombre: 'Efrén Egresado (QA)',
      correo: `egresado${DOMINIO_QA}`,
      estado: 'RECHAZADA',
      dias: 12,
      candidateProfileId: perfilEfren?.id,
    },
  ] as const

  for (const p of POSTULACIONES) {
    const { dias, ...campos } = p
    await prisma.postulacion.upsert({
      where: { vacanteId_correo: { vacanteId: p.vacanteId, correo: p.correo } },
      create: { ...campos, creadoEn: hace(dias) },
      update: { estado: p.estado },
    })
  }

  // --- solicitudes: una por estado ---
  const SOLICITUDES = [
    { tipo: 'CATEGORIA', categoria: 'estrategia', nombre: 'Planta Norte (QA)', estado: 'NUEVA', mensaje: 'Queremos rehacer nuestra planeación estratégica.' },
    { tipo: 'EMPRESA', categoria: null, nombre: 'Textiles del Sur (QA)', estado: 'EN_PROCESO', mensaje: 'Tenemos tres vacantes que queremos publicar.' },
    { tipo: 'CONTACTO', categoria: null, nombre: 'Curioso Anónimo (QA)', estado: 'ATENDIDA', mensaje: '¿Cobran por publicar?' },
    { tipo: 'CATEGORIA', categoria: 'finanzas', nombre: 'Grupo Viejo (QA)', estado: 'CERRADA', mensaje: 'Consulta que ya se resolvió.' },
  ] as const

  for (const [i, s] of SOLICITUDES.entries()) {
    const correo = `sol${i + 1}${DOMINIO_QA}`
    const datos = {
      tipo: s.tipo,
      categoryId: s.categoria ? (porSlug.get(s.categoria) ?? null) : null,
      nombre: s.nombre,
      correo,
      telefono: '5555555555',
      mensaje: s.mensaje,
      origen: 'contacto',
      estado: s.estado,
      creadoEn: hace(i + 1),
    }
    const existente = await prisma.solicitud.findFirst({ where: { correo } })
    if (existente) await prisma.solicitud.update({ where: { id: existente.id }, data: datos })
    else await prisma.solicitud.create({ data: datos })
  }

  // --- asesorías: una por estado ---
  const ASESORIAS = [
    { nivel: 'ESTUDIANTE', precio: 2500, estado: 'NUEVA', nombre: 'Iris Interesada (QA)' },
    { nivel: 'EXPERIMENTADO', precio: 3500, estado: 'CONTACTADA', nombre: 'Julio Contactado (QA)' },
    { nivel: 'GERENCIA', precio: 5000, estado: 'VENDIDA', nombre: 'Karla Vendida (QA)' },
    { nivel: 'EXPERIMENTADO', precio: 3500, estado: 'EN_CURSO', nombre: 'Luis En Curso (QA)' },
    { nivel: 'GERENCIA', precio: 5000, estado: 'COLOCADO', nombre: 'Mara Colocada (QA)' },
    { nivel: 'ESTUDIANTE', precio: 2500, estado: 'DESCARTADA', nombre: 'Nico Descartado (QA)' },
  ] as const

  for (const [i, a] of ASESORIAS.entries()) {
    const correo = `ase${i + 1}${DOMINIO_QA}`
    const datos = {
      nombre: a.nombre,
      correo,
      telefono: '5544332211',
      nivel: a.nivel,
      precioMostrado: a.precio,
      estado: a.estado,
      creadoEn: hace(i + 2),
    }
    const existente = await prisma.solicitudAsesoria.findFirst({ where: { correo } })
    if (existente) await prisma.solicitudAsesoria.update({ where: { id: existente.id }, data: datos })
    else await prisma.solicitudAsesoria.create({ data: datos })
  }

  console.log('')
  console.log('  Datos de QA sembrados')
  console.log(`  ${USUARIOS.length} usuarios · ${EMPRESAS.length} empresas · ${VACANTES.length} vacantes`)
  console.log(`  ${POSTULACIONES.length} postulaciones · ${SOLICITUDES.length} solicitudes · ${ASESORIAS.length} asesorías`)
  console.log('')
  console.log('  Cuentas con acceso al panel:')
  for (const u of USUARIOS.filter((x) => x.rol !== 'CANDIDATO')) {
    console.log(`    ${u.correo.padEnd(28)} ${PASSWORD_QA}   (${u.rol})`)
  }
  console.log('')
  console.log('  Candidatos (entran en /entrar y caen en /mi):')
  for (const u of USUARIOS.filter((x) => x.rol === 'CANDIDATO')) {
    console.log(`    ${u.correo.padEnd(28)} ${PASSWORD_QA}   ${u.nombre}`)
  }
  console.log('')
  console.log('  NO son datos reales. Antes de abrir la beta: pnpm db:seed:qa --limpiar')
  console.log('')
}

const main = process.argv.includes('--limpiar') ? limpiar : sembrar

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
