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
  { slug: `${MARCA}grupo-almendro`, nombre: 'Grupo Almendro (QA)', ubicacion: 'Monterrey, Nuevo León' },
  { slug: `${MARCA}textiles-laguna`, nombre: 'Textiles La Laguna (QA)', ubicacion: 'Torreón, Coahuila' },
  { slug: `${MARCA}clinica-altamar`, nombre: 'Clínica Altamar (QA)', ubicacion: 'Mérida, Yucatán' },
  { slug: `${MARCA}consultores-pacifico`, nombre: 'Consultores del Pacífico (QA)', ubicacion: 'Guadalajara, Jalisco' },
  { slug: `${MARCA}agroexporta-sinaloa`, nombre: 'Agroexporta Sinaloa (QA)', ubicacion: 'Culiacán, Sinaloa' },
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

/** Antepone la marca de QA al slug y a la empresa, para no repetirla en cada fila. */
const v = (
  x: Omit<SemillaVacante, 'slug' | 'empresa'> & { slug: string; empresa: string },
): SemillaVacante => ({
  ...x,
  slug: `${MARCA}${x.slug}`,
  empresa: `${MARCA}${x.empresa}`,
})

/**
 * El catálogo de QA. Tres vacantes por cada una de las siete categorías, con
 * sueldos que van de auxiliar a dirección, las cinco modalidades de estado, y
 * casos de borde a propósito: sueldo por hora, sueldo fijo, seguro social mixto
 * en varios porcentajes, procesos de una sola entrevista y de cinco.
 */
const VACANTES: SemillaVacante[] = [
  // ---------------------------------------------------------- estrategia
  v({
    slug: 'director-planeacion', empresa: 'grupo-almendro', categoria: 'estrategia',
    puesto: 'Director de planeación estratégica',
    descripcion: 'Conducir el plan a tres años del grupo y el tablero de indicadores de las cinco unidades de negocio. Reporta a dirección general.',
    ubicacion: 'Monterrey, Nuevo León', modalidad: 'HIBRIDO',
    sueldoMin: 140000, sueldoMax: 180000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 35,
    prestaciones: 'Ley, seguro de gastos médicos mayores con cobertura familiar, auto de la empresa, bono anual por resultados.',
    horario: 'Lunes a viernes, con disponibilidad para viajar una semana al mes.',
    conocimientos: ['Planeación estratégica', 'Balanced Scorecard', 'OKR', 'Gobierno corporativo'],
    numEntrevistas: 5, diasCierreEsperado: 55, estado: 'ABIERTA', publicadaHace: 12, venceEn: 48,
  }),
  v({
    slug: 'consultor-cambio', empresa: 'consultores-pacifico', categoria: 'estrategia',
    puesto: 'Consultor de gestión del cambio',
    descripcion: 'Acompañar a empresas medianas en procesos de reestructura: diagnóstico, plan de comunicación y seguimiento a la adopción.',
    ubicacion: 'Guadalajara, Jalisco', modalidad: 'HIBRIDO',
    sueldoMin: 38000, sueldoMax: 48000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, 20 días de vacaciones desde el primer año, capacitación pagada.',
    horario: 'Lunes a viernes, 9:00 a 18:00. Dos días en casa.',
    conocimientos: ['Gestión del cambio', 'Diagnóstico organizacional', 'Facilitación'],
    numEntrevistas: 3, diasCierreEsperado: 35, estado: 'ABIERTA', publicadaHace: 5, venceEn: 55,
  }),
  v({
    slug: 'analista-proyectos-estrategicos', empresa: 'grupo-almendro', categoria: 'estrategia',
    puesto: 'Analista de proyectos estratégicos',
    descripcion: 'Armar los modelos y la información que sostienen las decisiones de dirección. Mucho Excel y mucha pregunta incómoda.',
    ubicacion: 'Monterrey, Nuevo León', modalidad: 'PRESENCIAL',
    sueldoMin: 28000, sueldoMax: 34000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, fondo de ahorro del 8 %.',
    horario: 'Lunes a viernes, 8:30 a 18:00.',
    conocimientos: ['Excel avanzado', 'Modelado financiero', 'Power BI'],
    numEntrevistas: 2, diasCierreEsperado: 30, estado: 'ABIERTA', publicadaHace: 20, venceEn: 40,
  }),

  // ---------------------------------------------------------- comercial
  v({
    slug: 'gerente-ventas-nacional', empresa: 'textiles-laguna', categoria: 'comercial',
    puesto: 'Gerente de ventas nacional',
    descripcion: 'Dirigir a ocho representantes de venta y la relación con las cadenas de autoservicio. Cuota anual definida.',
    ubicacion: 'Torreón, Coahuila', modalidad: 'PRESENCIAL',
    sueldoMin: 55000, sueldoMax: 75000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 50,
    prestaciones: 'Ley, comisiones sobre cuota, auto y gasolina, seguro de vida.',
    horario: 'Lunes a viernes, con viajes frecuentes.',
    conocimientos: ['Ventas consultivas', 'Manejo de KAM', 'CRM', 'Negociación'],
    numEntrevistas: 4, diasCierreEsperado: 45, estado: 'ABIERTA', publicadaHace: 8, venceEn: 52,
  }),
  v({
    slug: 'especialista-marketing-digital', empresa: 'nube-verde', categoria: 'comercial',
    puesto: 'Especialista en marketing digital',
    descripcion: 'Campañas de adquisición, contenido y analítica para el canal digital de la empresa.',
    ubicacion: 'Ciudad de México', modalidad: 'REMOTO',
    sueldoMin: 32000, sueldoMax: 40000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 70,
    prestaciones: 'Ley, 20 días de vacaciones, presupuesto anual de cursos.',
    horario: 'Flexible, con traslape de 11:00 a 16:00.',
    conocimientos: ['SEO', 'Google Ads', 'Analítica', 'Redacción publicitaria'],
    numEntrevistas: 2, diasCierreEsperado: 30, estado: 'ABIERTA', publicadaHace: 2, venceEn: 58,
  }),
  v({
    slug: 'promotor-punto-venta', empresa: 'textiles-laguna', categoria: 'comercial',
    puesto: 'Promotor de punto de venta',
    descripcion: 'Acomodo, exhibición y levantamiento de pedidos en tiendas asignadas de la zona.',
    ubicacion: 'Torreón, Coahuila', modalidad: 'PRESENCIAL',
    sueldoMin: 9500, sueldoMax: 9500, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, apoyo de transporte.',
    horario: 'Lunes a sábado, 9:00 a 17:00.',
    conocimientos: ['Atención a cliente', 'Manejo de inventario en piso'],
    numEntrevistas: 1, diasCierreEsperado: 12, estado: 'ABIERTA', publicadaHace: 15, venceEn: 45,
  }),

  // ---------------------------------------------------------- capital humano
  v({
    slug: 'gerente-capital-humano', empresa: 'clinica-altamar', categoria: 'capital-humano',
    puesto: 'Gerente de capital humano',
    descripcion: 'Llevar reclutamiento, nómina, clima y relaciones laborales de una plantilla de 240 personas.',
    ubicacion: 'Mérida, Yucatán', modalidad: 'PRESENCIAL',
    sueldoMin: 48000, sueldoMax: 58000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, seguro de gastos médicos mayores, 18 días de aguinaldo, servicio médico interno.',
    horario: 'Lunes a viernes, 8:00 a 17:00.',
    conocimientos: ['Relaciones laborales', 'LFT', 'Nóminas', 'Clima organizacional'],
    numEntrevistas: 3, diasCierreEsperado: 40, estado: 'ABIERTA', publicadaHace: 6, venceEn: 54,
  }),
  v({
    slug: 'analista-nomina', empresa: 'metalurgica-bajio', categoria: 'capital-humano',
    puesto: 'Analista de nómina',
    descripcion: 'Cálculo de nómina semanal y atención a incidencias del personal de planta.',
    ubicacion: 'León, Guanajuato', modalidad: 'HIBRIDO',
    sueldoMin: 26000, sueldoMax: 30000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, fondo de ahorro, 16 días de aguinaldo.',
    horario: 'Lunes a viernes, 9:00 a 18:00. Dos días en casa.',
    conocimientos: ['Nóminas', 'IMSS', 'Excel avanzado'],
    numEntrevistas: 2, diasCierreEsperado: 25,
    estado: 'BORRADOR', publicadaHace: null, venceEn: null,
  }),
  v({
    slug: 'reclutador-junior', empresa: 'consultores-pacifico', categoria: 'capital-humano',
    puesto: 'Reclutador junior',
    descripcion: 'Filtro telefónico, entrevistas iniciales y seguimiento de candidatos para clientes de manufactura.',
    ubicacion: 'Guadalajara, Jalisco', modalidad: 'HIBRIDO',
    sueldoMin: 14000, sueldoMax: 17000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, un día libre en tu cumpleaños.',
    horario: 'Lunes a viernes, 9:00 a 18:00.',
    conocimientos: ['Reclutamiento', 'Entrevista por competencias', 'ATS'],
    numEntrevistas: 2, diasCierreEsperado: 20, estado: 'ABIERTA', publicadaHace: 25, venceEn: 35,
  }),

  // ---------------------------------------------------------- operaciones
  v({
    slug: 'soldador-certificado', empresa: 'metalurgica-bajio', categoria: 'operaciones',
    puesto: 'Soldador certificado',
    descripcion: 'Soldadura MIG y TIG en línea de producción. Turno fijo, sin rotación.',
    ubicacion: 'León, Guanajuato', modalidad: 'PRESENCIAL',
    sueldoMin: 18000, sueldoMax: 22000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, comedor subsidiado, transporte de personal, bono de asistencia.',
    horario: 'Lunes a viernes, 7:00 a 16:30.',
    conocimientos: ['Soldadura MIG', 'Soldadura TIG', 'Lectura de planos'],
    numEntrevistas: 1, diasCierreEsperado: 15, estado: 'ABIERTA', publicadaHace: 3, venceEn: 57,
  }),
  v({
    slug: 'jefe-mantenimiento', empresa: 'agroexporta-sinaloa', categoria: 'operaciones',
    puesto: 'Jefe de mantenimiento industrial',
    descripcion: 'Mantenimiento preventivo y correctivo de la línea de empaque y los cuartos fríos.',
    ubicacion: 'Culiacán, Sinaloa', modalidad: 'PRESENCIAL',
    sueldoMin: 35000, sueldoMax: 42000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, comedor, alojamiento en temporada alta, bono de productividad.',
    horario: 'Lunes a sábado, con guardias rotativas.',
    conocimientos: ['Mantenimiento predictivo', 'Refrigeración industrial', 'TPM', 'Hidráulica'],
    numEntrevistas: 2, diasCierreEsperado: 25, estado: 'ABIERTA', publicadaHace: 18, venceEn: 42,
  }),
  v({
    slug: 'operador-produccion-turno', empresa: 'agroexporta-sinaloa', categoria: 'operaciones',
    puesto: 'Operador de producción por turno',
    descripcion: 'Operación de línea de empaque en temporada de exportación. Contratación eventual con posibilidad de planta.',
    ubicacion: 'Culiacán, Sinaloa', modalidad: 'PRESENCIAL',
    sueldoMin: 42, sueldoMax: 55, periodicidad: 'POR_HORA',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, comedor, transporte de personal, equipo de protección incluido.',
    horario: 'Turnos rotativos de 8 horas, seis días por semana.',
    conocimientos: ['Buenas prácticas de manufactura', 'Inocuidad alimentaria'],
    numEntrevistas: 1, diasCierreEsperado: 8, estado: 'ABIERTA', publicadaHace: 1, venceEn: 59,
  }),

  // ---------------------------------------------------------- tecnología
  v({
    slug: 'ingeniera-plataforma', empresa: 'nube-verde', categoria: 'tecnologia',
    puesto: 'Ingeniera de plataforma',
    descripcion: 'Mantener la infraestructura sobre la que corren los equipos de producto. Kubernetes, Terraform y mucho trabajo de fondo.',
    ubicacion: 'Ciudad de México', modalidad: 'REMOTO',
    sueldoMin: 70000, sueldoMax: 95000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 40,
    prestaciones: 'Ley, seguro de gastos médicos mayores, 25 días de vacaciones, presupuesto de equipo.',
    horario: 'Flexible, con traslape de 11:00 a 16:00.',
    conocimientos: ['Kubernetes', 'Terraform', 'Go', 'Observabilidad'],
    numEntrevistas: 4, diasCierreEsperado: 50,
    estado: 'ABIERTA', publicadaHace: 48, venceEn: 6,
  }),
  v({
    slug: 'desarrollador-frontend', empresa: 'nube-verde', categoria: 'tecnologia',
    puesto: 'Desarrollador frontend',
    descripcion: 'Construir las pantallas del producto con React y TypeScript. Equipo de seis personas, sin guardias.',
    ubicacion: 'Ciudad de México', modalidad: 'REMOTO',
    sueldoMin: 45000, sueldoMax: 62000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 40,
    prestaciones: 'Ley, seguro de gastos médicos mayores, 22 días de vacaciones.',
    horario: 'Flexible, con traslape de 11:00 a 16:00.',
    conocimientos: ['React', 'TypeScript', 'Accesibilidad', 'Pruebas automatizadas'],
    numEntrevistas: 3, diasCierreEsperado: 40, estado: 'ABIERTA', publicadaHace: 4, venceEn: 56,
  }),
  v({
    slug: 'soporte-sistemas', empresa: 'clinica-altamar', categoria: 'tecnologia',
    puesto: 'Auxiliar de soporte en sistemas',
    descripcion: 'Atención a usuarios de la clínica, altas de equipo y respaldo del expediente electrónico.',
    ubicacion: 'Mérida, Yucatán', modalidad: 'PRESENCIAL',
    sueldoMin: 13000, sueldoMax: 16000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, servicio médico interno, comedor.',
    horario: 'Lunes a viernes, 8:00 a 17:00, con guardia un sábado al mes.',
    conocimientos: ['Soporte técnico', 'Redes', 'Windows Server'],
    numEntrevistas: 2, diasCierreEsperado: 18, estado: 'ABIERTA', publicadaHace: 30, venceEn: 30,
  }),

  // ---------------------------------------------------------- finanzas
  v({
    slug: 'contador-general', empresa: 'nube-verde', categoria: 'finanzas',
    puesto: 'Contador general',
    descripcion: 'Cierre mensual, conciliaciones y trato con el despacho externo.',
    ubicacion: 'Ciudad de México', modalidad: 'HIBRIDO',
    sueldoMin: 45000, sueldoMax: 55000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, seguro de gastos médicos mayores.',
    horario: 'Lunes a viernes, 9:00 a 18:00.',
    conocimientos: ['Contabilidad', 'CFDI', 'Conciliaciones'],
    numEntrevistas: 3, diasCierreEsperado: 40,
    estado: 'CUBIERTA', publicadaHace: 35, venceEn: 25,
  }),
  v({
    slug: 'analista-credito-cobranza', empresa: 'grupo-almendro', categoria: 'finanzas',
    puesto: 'Analista de crédito y cobranza',
    descripcion: 'Evaluación de líneas de crédito a distribuidores y seguimiento a cartera vencida.',
    ubicacion: 'Monterrey, Nuevo León', modalidad: 'HIBRIDO',
    sueldoMin: 22000, sueldoMax: 27000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, fondo de ahorro.',
    horario: 'Lunes a viernes, 9:00 a 18:00. Un día en casa.',
    conocimientos: ['Análisis de crédito', 'Cobranza', 'SAP'],
    numEntrevistas: 2, diasCierreEsperado: 28, estado: 'ABIERTA', publicadaHace: 10, venceEn: 50,
  }),
  v({
    slug: 'auxiliar-contable', empresa: 'consultores-pacifico', categoria: 'finanzas',
    puesto: 'Auxiliar contable',
    descripcion: 'Captura de pólizas, conciliación bancaria y apoyo en declaraciones mensuales.',
    ubicacion: 'Guadalajara, Jalisco', modalidad: 'PRESENCIAL',
    sueldoMin: 12500, sueldoMax: 12500, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, horario reducido los viernes.',
    horario: 'Lunes a jueves 9:00 a 18:00, viernes 9:00 a 15:00.',
    conocimientos: ['Contabilidad básica', 'CONTPAQi', 'Excel'],
    numEntrevistas: 1, diasCierreEsperado: 15, estado: 'ABIERTA', publicadaHace: 22, venceEn: 38,
  }),

  // ---------------------------------------------------------- comercio exterior
  v({
    slug: 'coordinador-comercio-exterior', empresa: 'agroexporta-sinaloa', categoria: 'comex',
    puesto: 'Coordinador de comercio exterior',
    descripcion: 'Coordinar exportaciones a Estados Unidos y Canadá, tratar con agentes aduanales y mantener la documentación en regla.',
    ubicacion: 'Culiacán, Sinaloa', modalidad: 'HIBRIDO',
    sueldoMin: 32000, sueldoMax: 38000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa, fondo de ahorro, 15 días de aguinaldo.',
    horario: 'Lunes a viernes, 8:00 a 17:00. Dos días en casa.',
    conocimientos: ['INCOTERMS', 'Pedimentos', 'T-MEC', 'Inglés intermedio'],
    numEntrevistas: 2, diasCierreEsperado: 30, estado: 'ABIERTA', publicadaHace: 7, venceEn: 53,
  }),
  v({
    slug: 'auxiliar-almacen', empresa: 'logistica-istmo', categoria: 'comex',
    puesto: 'Auxiliar de almacén',
    descripcion: 'Recibo, acomodo y surtido de mercancía de importación.',
    ubicacion: 'Veracruz, Veracruz', modalidad: 'PRESENCIAL',
    sueldoMin: 280, sueldoMax: 280, periodicidad: 'POR_HORA',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, vales de despensa.',
    horario: 'Turnos rotativos de 8 horas, seis días.',
    conocimientos: ['Manejo de montacargas', 'Inventarios'],
    numEntrevistas: 1, diasCierreEsperado: 10, estado: 'ABIERTA', publicadaHace: 10, venceEn: 50,
  }),
  v({
    slug: 'gerente-cadena-suministro', empresa: 'logistica-istmo', categoria: 'comex',
    puesto: 'Gerente de cadena de suministro',
    descripcion: 'Planeación de la demanda, relación con navieras y control del costo logístico total.',
    ubicacion: 'Veracruz, Veracruz', modalidad: 'PRESENCIAL',
    sueldoMin: 60000, sueldoMax: 78000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 60,
    prestaciones: 'Ley, seguro de gastos médicos mayores, auto de la empresa, bono anual.',
    horario: 'Lunes a viernes, con disponibilidad en cierres de mes.',
    conocimientos: ['S&OP', 'Transporte marítimo', 'Costeo logístico', 'Inglés avanzado'],
    numEntrevistas: 4, diasCierreEsperado: 45, estado: 'ABIERTA', publicadaHace: 14, venceEn: 46,
  }),

  // ------------------------------------------------ ya cerradas, para el panel
  v({
    slug: 'coordinador-marketing', empresa: 'nube-verde', categoria: 'comercial',
    puesto: 'Coordinador de marketing',
    descripcion: 'Campañas de adquisición y contenido para el canal digital.',
    ubicacion: 'Ciudad de México', modalidad: 'REMOTO',
    sueldoMin: 35000, sueldoMax: 42000, periodicidad: 'MENSUAL',
    seguroSocial: 'MIXTO', seguroSocialPct: 70,
    prestaciones: 'Ley, 20 días de vacaciones.',
    horario: 'Flexible.',
    conocimientos: ['SEO', 'Analítica', 'Contenido'],
    numEntrevistas: 2, diasCierreEsperado: 30,
    estado: 'EXPIRADA', publicadaHace: 70, venceEn: -10,
  }),
  v({
    slug: 'supervisor-corte', empresa: 'textiles-laguna', categoria: 'operaciones',
    puesto: 'Supervisor de corte',
    descripcion: 'Supervisión de la mesa de corte y del cumplimiento del programa semanal.',
    ubicacion: 'Torreón, Coahuila', modalidad: 'PRESENCIAL',
    sueldoMin: 19000, sueldoMax: 23000, periodicidad: 'MENSUAL',
    seguroSocial: 'COMPLETO', seguroSocialPct: 100,
    prestaciones: 'Ley, comedor, transporte.',
    horario: 'Lunes a sábado, turno matutino.',
    conocimientos: ['Supervisión de personal', 'Control de calidad'],
    numEntrevistas: 2, diasCierreEsperado: 20,
    estado: 'CERRADA', publicadaHace: 50, venceEn: 10,
  }),
]

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

  // --- postulaciones ---
  // Repartidas entre varias vacantes y cubriendo los seis estados, para que el
  // panel se parezca a una bandeja de verdad y no a un caso de prueba.
  const porSlugVacante = new Map(
    (await prisma.vacante.findMany({ select: { id: true, slug: true } })).map((x) => [x.slug, x.id]),
  )
  const idDe = (slug: string) => {
    const id = porSlugVacante.get(`${MARCA}${slug}`)
    if (!id) throw new Error(`Falta la vacante ${slug}.`)
    return id
  }

  const perfilCarla = await prisma.candidateProfile.findFirst({
    where: { user: { email: `candidato${DOMINIO_QA}` } },
  })
  const perfilEfren = await prisma.candidateProfile.findFirst({
    where: { user: { email: `egresado${DOMINIO_QA}` } },
  })

  const POSTULACIONES = [
    // Una vacante muy solicitada: cinco personas en distintos momentos.
    { v: 'ingeniera-plataforma', nombre: 'Rosa Nueva (QA)', correo: `p1${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 1 },
    { v: 'ingeniera-plataforma', nombre: 'Beto Revisión (QA)', correo: `p2${DOMINIO_QA}`, estado: 'EN_REVISION', dias: 4 },
    { v: 'ingeniera-plataforma', nombre: 'Carla Candidata (QA)', correo: `candidato${DOMINIO_QA}`, estado: 'ENTREVISTA', dias: 8, perfil: perfilCarla?.id },
    { v: 'ingeniera-plataforma', nombre: 'Efrén Egresado (QA)', correo: `egresado${DOMINIO_QA}`, estado: 'RECHAZADA', dias: 12, perfil: perfilEfren?.id },
    { v: 'ingeniera-plataforma', nombre: 'Hugo Paciente (QA)', correo: `p7${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 2 },

    // Una ya cubierta: el cierre en cascada se ve completo.
    { v: 'contador-general', nombre: 'Dani Contratada (QA)', correo: `p4${DOMINIO_QA}`, estado: 'CONTRATADA', dias: 25 },
    { v: 'contador-general', nombre: 'Eva Rechazada (QA)', correo: `p5${DOMINIO_QA}`, estado: 'RECHAZADA', dias: 22 },
    { v: 'contador-general', nombre: 'Fer Sin Suerte (QA)', correo: `p6${DOMINIO_QA}`, estado: 'VACANTE_CUBIERTA', dias: 20 },

    // Y unas cuantas sueltas, para que la bandeja tenga variedad.
    { v: 'soldador-certificado', nombre: 'Ignacio Soldador (QA)', correo: `p8${DOMINIO_QA}`, estado: 'EN_REVISION', dias: 3 },
    { v: 'soldador-certificado', nombre: 'Julia Torres (QA)', correo: `p9${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 1 },
    { v: 'desarrollador-frontend', nombre: 'Karina Vega (QA)', correo: `p10${DOMINIO_QA}`, estado: 'ENTREVISTA', dias: 6 },
    { v: 'gerente-ventas-nacional', nombre: 'Leo Mendoza (QA)', correo: `p11${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 2 },
    { v: 'gerente-cadena-suministro', nombre: 'Mónica Ríos (QA)', correo: `p12${DOMINIO_QA}`, estado: 'EN_REVISION', dias: 5 },
    { v: 'auxiliar-contable', nombre: 'Noé Salas (QA)', correo: `p13${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 3 },
    { v: 'operador-produccion-turno', nombre: 'Olga Pineda (QA)', correo: `p14${DOMINIO_QA}`, estado: 'RECIBIDA', dias: 1 },
  ] as const

  for (const x of POSTULACIONES) {
    const vacanteId = idDe(x.v)
    await prisma.postulacion.upsert({
      where: { vacanteId_correo: { vacanteId, correo: x.correo } },
      create: {
        vacanteId,
        nombre: x.nombre,
        correo: x.correo,
        estado: x.estado,
        candidateProfileId: x.perfil ?? null,
        creadoEn: hace(x.dias),
      },
      update: { estado: x.estado, candidateProfileId: x.perfil ?? null },
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
