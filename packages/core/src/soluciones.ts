/**
 * Las siete verticales de Soluciones Empresariales (máster prompt §5).
 *
 * Fuente única: de aquí salen las páginas públicas y la semilla de la tabla
 * `Category`. Los slugs no cambian respecto a la landing original para no
 * romper ligas ni datos; los nombres sí, a los del máster prompt.
 *
 * Reglas del texto:
 * - Primero el problema que resuelve cada servicio; la metodología, después.
 * - Todo término técnico tiene su explicación en `glosario`.
 * - Nada dice que AIUTO ejecuta directamente: conecta con especialistas y
 *   acompaña. El catálogo está sujeto a validar el portafolio real.
 */

export type Servicio = { nombre: string; resuelve: string }
export type Termino = { termino: string; significa: string }

export type Vertical = {
  slug: string
  nombre: string
  corto: string
  color: string
  colorDark: string
  colorTint: string
  /** Trazo SVG de 24×24 para el ícono. */
  icono: string
  /** Una línea para tarjetas y menús. */
  lema: string
  /** La explicación sencilla de la categoría. */
  explicacion: string
  problemas: string[]
  servicios: Servicio[]
  beneficios: string[]
  glosario: Termino[]
}

export const VERTICALES: Vertical[] = [
  {
    slug: 'estrategia',
    nombre: 'Estrategia y Dirección',
    corto: 'Estrategia',
    color: '#66a2ba',
    colorDark: '#2f6d86',
    colorTint: '#eef4f7',
    icono: 'M12 4.5v15M4.5 12h15M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
    lema: 'Rumbo claro y decisiones que se cumplen',
    explicacion:
      'Para cuando el negocio crece más rápido que su organización, o cuando todos trabajan mucho pero no hacia el mismo lado. Ayudamos a definir a dónde ir, cómo medirlo y quién hace qué.',
    problemas: [
      'Cada área jala para su lado y las prioridades cambian cada semana.',
      'El negocio depende de que el dueño esté en todo.',
      'Se hacen planes que nadie revisa después.',
      'No hay forma clara de saber si la empresa va bien o mal.',
    ],
    servicios: [
      { nombre: 'Planeación estratégica y objetivos empresariales', resuelve: 'Definir a dónde quiere llegar la empresa en uno a tres años y bajarlo a metas concretas por área.' },
      { nombre: 'Diagnóstico organizacional', resuelve: 'Una revisión a fondo para saber qué funciona, qué estorba y dónde conviene empezar.' },
      { nombre: 'Desarrollo de modelos de negocio', resuelve: 'Revisar cómo gana dinero la empresa y encontrar formas nuevas o más rentables de hacerlo.' },
      { nombre: 'Liderazgo y desarrollo directivo', resuelve: 'Preparar a quienes dirigen para tomar decisiones, delegar y formar equipos.' },
      { nombre: 'Gestión del cambio organizacional', resuelve: 'Que un cambio importante (sistema, estructura, dueño) se adopte sin frenar la operación.' },
      { nombre: 'Alineación y ejecución de prioridades', resuelve: 'Que lo acordado se haga: pocas prioridades, responsables claros y revisiones periódicas.' },
      { nombre: 'Gobierno y profesionalización empresarial', resuelve: 'Ordenar cómo se decide en empresas familiares o en crecimiento: consejo, reglas y roles.' },
      { nombre: 'Indicadores estratégicos y desempeño', resuelve: 'Elegir los pocos números que dicen si la empresa avanza, y revisarlos con disciplina.' },
    ],
    beneficios: [
      'Un plan que el equipo entiende y puede seguir.',
      'Decisiones más rápidas y con menos dependencia del dueño.',
      'Una forma objetiva de saber si se avanza.',
    ],
    glosario: [
      { termino: 'KPI', significa: 'Indicador clave de desempeño: un número que dice si algo importante va bien (ventas del mes, clientes perdidos).' },
      { termino: 'OKR', significa: 'Objetivos y resultados clave: una forma de fijar metas trimestrales con resultados medibles.' },
      { termino: 'Gestión del cambio', significa: 'El trabajo de preparar a las personas para que un cambio se adopte de verdad y no se quede en papel.' },
      { termino: 'Gobierno corporativo', significa: 'Las reglas sobre quién decide qué en la empresa, y cómo se rinden cuentas.' },
    ],
  },
  {
    slug: 'comercial',
    nombre: 'Ventas y Crecimiento',
    corto: 'Ventas',
    color: '#c20e59',
    colorDark: '#96063f',
    colorTint: '#fbeef3',
    icono: 'M3.5 20.5h17M6 17V9M11 17V4.5M16 17v-6M20.5 17v-9',
    lema: 'Vender más, y venderle mejor a quien ya te compra',
    explicacion:
      'Para cuando las ventas dependen de una o dos personas, los clientes no regresan o el mercado actual ya no alcanza. Ayudamos a ordenar cómo se vende, a quién y con qué mensaje.',
    problemas: [
      'Las ventas suben y bajan sin que nadie sepa bien por qué.',
      'Todo depende del mejor vendedor; si se va, se va la venta.',
      'Se gasta en publicidad sin saber qué funciona.',
      'Los clientes compran una vez y no regresan.',
    ],
    servicios: [
      { nombre: 'Estrategia comercial', resuelve: 'Definir a qué clientes ir, con qué oferta y por qué canal, para dejar de vender a ciegas.' },
      { nombre: 'Desarrollo de equipos de ventas', resuelve: 'Reclutar, entrenar y dar metas claras a quienes venden.' },
      { nombre: 'Ventas consultivas y negociación', resuelve: 'Vender entendiendo el problema del cliente, no solo el precio, y cerrar mejores acuerdos.' },
      { nombre: 'Experiencia y lealtad del cliente', resuelve: 'Que el cliente quede contento, regrese y te recomiende.' },
      { nombre: 'Marketing y posicionamiento', resuelve: 'Que te conozcan por lo que haces bien y que tu mensaje llegue a quien sí te compra.' },
      { nombre: 'Diseño y optimización de procesos comerciales', resuelve: 'Ordenar los pasos desde el primer contacto hasta la cobranza para que nada se caiga.' },
      { nombre: 'Implementación y aprovechamiento de CRM', resuelve: 'Tener en un solo lugar clientes, oportunidades y seguimiento, y que el equipo sí lo use.' },
      { nombre: 'Desarrollo de nuevos mercados y oportunidades', resuelve: 'Encontrar y probar nuevos segmentos, regiones o productos antes de invertir fuerte.' },
    ],
    beneficios: [
      'Ventas más predecibles y menos dependientes de una persona.',
      'Mejor uso del presupuesto de marketing.',
      'Clientes que regresan y recomiendan.',
    ],
    glosario: [
      { termino: 'CRM', significa: 'Sistema para registrar clientes, oportunidades y seguimiento de ventas en un solo lugar.' },
      { termino: 'Embudo de ventas', significa: 'Las etapas por las que pasa un prospecto hasta comprar; sirve para ver dónde se pierden.' },
      { termino: 'Venta consultiva', significa: 'Vender a partir de entender el problema del cliente y proponer la solución adecuada.' },
    ],
  },
  {
    slug: 'capital-humano',
    nombre: 'Recursos Humanos',
    corto: 'Recursos Humanos',
    color: '#7cb39a',
    colorDark: '#3f7a5f',
    colorTint: '#eef5f1',
    icono: 'M9 8.5a3 3 0 1 0 0-.01M4 20.5c0-3 2.2-5 5-5s5 2 5 5M15.5 15.8c2 .5 3.5 2.3 3.5 4.7M15 4.6a3 3 0 0 1 0 5.8',
    lema: 'La gente correcta, preparada y con ganas de quedarse',
    explicacion:
      'Para cuando cuesta encontrar a la persona adecuada, la gente se va pronto o el ambiente de trabajo pesa. Ayudamos a atraer, elegir, desarrollar y cuidar al talento, y a cumplir con la ley.',
    problemas: [
      'Contratar tarda mucho y aun así no siempre se acierta.',
      'La rotación es alta y cada salida cuesta.',
      'No hay claridad de sueldos, puestos ni crecimiento.',
      'Hay dudas sobre cumplir la NOM-035 y otras obligaciones laborales.',
    ],
    servicios: [
      { nombre: 'Reclutamiento y headhunting', resuelve: 'Encontrar a la persona adecuada, incluso la que hoy no está buscando trabajo.' },
      { nombre: 'Evaluación y selección de talento', resuelve: 'Elegir con pruebas y entrevistas bien hechas, no solo por intuición.' },
      { nombre: 'Capacitación y desarrollo profesional', resuelve: 'Preparar al equipo en lo que de verdad necesita para su puesto.' },
      { nombre: 'Cultura y clima organizacional', resuelve: 'Medir y mejorar cómo se vive el trabajo dentro de la empresa.' },
      { nombre: 'Liderazgo y desempeño', resuelve: 'Que los jefes sepan dar dirección y retroalimentación, y que el desempeño se evalúe con criterios claros.' },
      { nombre: 'Compensaciones y productividad', resuelve: 'Pagar de forma justa y competitiva, ligando incentivos a resultados.' },
      { nombre: 'Cumplimiento laboral y NOM-035', resuelve: 'Cumplir con las obligaciones laborales y de riesgo psicosocial sin sustos en una inspección.' },
      { nombre: 'Gestión del talento y desarrollo organizacional', resuelve: 'Planes de carrera, sucesión y estructura para que la empresa crezca con su gente.' },
    ],
    beneficios: [
      'Contrataciones más rápidas y acertadas.',
      'Menos rotación y mejor ambiente.',
      'Cumplimiento legal en orden.',
    ],
    glosario: [
      { termino: 'Headhunting', significa: 'Búsqueda directa de personas con un perfil específico, aunque no estén buscando empleo.' },
      { termino: 'NOM-035', significa: 'Norma mexicana que obliga a identificar y prevenir factores de riesgo psicosocial en el trabajo.' },
      { termino: 'Clima organizacional', significa: 'Cómo perciben las personas su entorno de trabajo: trato, carga, comunicación.' },
    ],
  },
  {
    slug: 'operaciones',
    nombre: 'Procesos y Operaciones',
    corto: 'Operaciones',
    color: '#c21624',
    colorDark: '#94101b',
    colorTint: '#fbeeef',
    icono: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
    lema: 'Hacer lo mismo con menos errores, tiempo y costo',
    explicacion:
      'Para cuando las cosas salen, pero con retrasos, retrabajos o porque alguien "se sabe" cómo hacerlas. Ayudamos a documentar, ordenar y mejorar cómo trabaja la operación.',
    problemas: [
      'Los mismos errores se repiten y cuestan dinero.',
      'Cada quien hace el trabajo a su manera.',
      'Los proyectos se retrasan y se pasan de presupuesto.',
      'Si falla un proveedor o un sistema, todo se detiene.',
    ],
    servicios: [
      { nombre: 'Diagnóstico y mapeo de procesos', resuelve: 'Dibujar cómo se trabaja hoy para ver dónde se pierde tiempo y dinero.' },
      { nombre: 'Rediseño y optimización operativa', resuelve: 'Quitar pasos que sobran y reorganizar el trabajo para que fluya.' },
      { nombre: 'Estandarización de procedimientos', resuelve: 'Que todos hagan lo mismo de la misma manera, por escrito, y que no dependa de una persona.' },
      { nombre: 'Mejora continua y productividad', resuelve: 'Un método para mejorar poco a poco y de forma constante, con el equipo.' },
      { nombre: 'Calidad y control operativo', resuelve: 'Detectar fallas antes de que lleguen al cliente.' },
      { nombre: 'Continuidad del negocio', resuelve: 'Un plan para seguir operando si falla un proveedor, un sistema o una instalación.' },
      { nombre: 'Gestión de proyectos', resuelve: 'Que los proyectos terminen a tiempo, dentro de presupuesto y con lo prometido.' },
      { nombre: 'Optimización de recursos y eficiencia', resuelve: 'Usar mejor personas, materiales, espacio y equipo.' },
    ],
    beneficios: [
      'Menos errores y retrabajos.',
      'Operación que no depende de personas clave.',
      'Costos más bajos con el mismo resultado.',
    ],
    glosario: [
      { termino: 'AS IS / TO BE', significa: 'Comparar cómo funciona un proceso hoy (AS IS) con cómo debería funcionar (TO BE).' },
      { termino: 'Mejora continua', significa: 'Mejorar en ciclos cortos y frecuentes en lugar de esperar grandes cambios.' },
      { termino: 'Lean', significa: 'Enfoque para eliminar desperdicios: esperas, movimientos y pasos que no agregan valor.' },
    ],
  },
  {
    slug: 'tecnologia',
    nombre: 'Tecnología e Inteligencia Artificial',
    corto: 'Tecnología e IA',
    color: '#572967',
    colorDark: '#3d1c49',
    colorTint: '#f3eff5',
    icono: 'M8 8h8v8H8zM4.5 4.5h15v15h-15zM12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3',
    lema: 'Tecnología que ahorra trabajo, no que lo agrega',
    explicacion:
      'Para cuando se trabaja en hojas de cálculo que nadie entiende, los sistemas no se hablan entre sí o se quiere usar inteligencia artificial pero no se sabe por dónde empezar.',
    problemas: [
      'La información está regada en archivos y sistemas que no se conectan.',
      'Se capturan los mismos datos varias veces.',
      'Se compró un sistema que nadie usa bien.',
      'Se habla de inteligencia artificial sin un caso de uso concreto.',
    ],
    servicios: [
      { nombre: 'Diagnóstico de madurez digital', resuelve: 'Saber qué tan preparada está la empresa en tecnología y qué conviene hacer primero.' },
      { nombre: 'Automatización de procesos', resuelve: 'Que las tareas repetitivas las haga un sistema y no una persona.' },
      { nombre: 'Implementación y mejora de ERP', resuelve: 'Elegir, poner en marcha o arreglar el sistema que integra inventario, compras, ventas y contabilidad.' },
      { nombre: 'Soluciones CRM', resuelve: 'Un sistema para dar seguimiento a clientes y ventas que el equipo sí adopte.' },
      { nombre: 'Inteligencia artificial aplicada', resuelve: 'Usar IA en casos concretos: atender clientes, clasificar documentos, pronosticar demanda.' },
      { nombre: 'Integración de sistemas', resuelve: 'Que los sistemas se pasen información solos, sin capturar dos veces.' },
      { nombre: 'Gestión y analítica de datos', resuelve: 'Convertir los datos de la empresa en tableros y reportes que ayudan a decidir.' },
      { nombre: 'Acompañamiento en transformación digital', resuelve: 'Un plan por etapas para modernizar la empresa sin frenar la operación.' },
    ],
    beneficios: [
      'Menos captura manual y menos errores.',
      'Información confiable y a tiempo para decidir.',
      'Inversión en tecnología con retorno claro.',
    ],
    glosario: [
      { termino: 'ERP', significa: 'Sistema que integra las áreas de la empresa (inventario, compras, ventas, contabilidad) en una sola base.' },
      { termino: 'CRM', significa: 'Sistema para registrar clientes, oportunidades y seguimiento de ventas.' },
      { termino: 'Automatización', significa: 'Que un sistema haga solo una tarea repetitiva que antes hacía una persona.' },
      { termino: 'Analítica de datos', significa: 'Ordenar y analizar datos para responder preguntas del negocio.' },
    ],
  },
  {
    slug: 'finanzas',
    nombre: 'Finanzas e Impuestos',
    corto: 'Finanzas',
    color: '#cd5d22',
    colorDark: '#9c4415',
    colorTint: '#fbf1ea',
    icono: 'M3.5 6.5h11v11h-11zM9.5 6.5V3.5h11v11h-3M6 12h6',
    lema: 'Saber cuánto ganas, cuánto tienes y cuánto pagas',
    explicacion:
      'Para cuando se vende bien pero no alcanza el dinero, los impuestos son una sorpresa o no se sabe qué productos sí dejan ganancia. Ayudamos a planear, controlar y cumplir.',
    problemas: [
      'Hay ventas pero falta dinero para pagar.',
      'No se sabe qué productos o clientes son rentables.',
      'Los impuestos llegan como sorpresa.',
      'Se decide invertir sin números que lo respalden.',
    ],
    servicios: [
      { nombre: 'Planeación financiera', resuelve: 'Proyectar ingresos, gastos y necesidades de dinero para los próximos meses.' },
      { nombre: 'Administración de flujo de efectivo', resuelve: 'Que el dinero alcance: cobrar a tiempo, pagar con orden y anticipar faltantes.' },
      { nombre: 'Presupuestos y control financiero', resuelve: 'Fijar cuánto se puede gastar por área y revisar que se cumpla.' },
      { nombre: 'Asesoría fiscal', resuelve: 'Pagar lo que corresponde, aprovechar lo que la ley permite y evitar multas.' },
      { nombre: 'Análisis de rentabilidad', resuelve: 'Saber qué productos, clientes o sucursales dejan dinero y cuáles no.' },
      { nombre: 'Evaluación financiera de proyectos', resuelve: 'Revisar con números si una inversión conviene antes de hacerla.' },
      { nombre: 'Control interno y cumplimiento', resuelve: 'Reglas para cuidar el dinero de la empresa y evitar errores o fraudes.' },
      { nombre: 'Optimización de costos', resuelve: 'Bajar gastos sin afectar lo que el cliente valora.' },
    ],
    beneficios: [
      'Dinero disponible cuando se necesita.',
      'Decisiones de inversión con números.',
      'Obligaciones fiscales en orden.',
    ],
    glosario: [
      { termino: 'Flujo de efectivo', significa: 'El dinero que entra y sale en un periodo; se puede tener utilidad y aun así no tener efectivo.' },
      { termino: 'Rentabilidad', significa: 'Cuánto deja una venta, producto o cliente después de cubrir sus costos.' },
      { termino: 'Control interno', significa: 'Reglas y revisiones para proteger los recursos y que la información sea confiable.' },
    ],
  },
  {
    slug: 'comex',
    nombre: 'Comercio Exterior y Logística',
    corto: 'Comercio Exterior',
    color: '#158a92',
    colorDark: '#0f6a70',
    colorTint: '#eaf4f5',
    icono: 'M3.5 14.5h17l-2.5 6h-12zM12 3.5v11M6.5 9.5h11l1 5M6.5 9.5v5',
    lema: 'Mover, importar y exportar sin atorarse',
    explicacion:
      'Para cuando la mercancía se atora en aduana, los fletes se comen el margen o se quiere vender en otro país. Ayudamos con trámites, logística y expansión internacional.',
    problemas: [
      'La mercancía se detiene en aduana por documentos o clasificación.',
      'Los costos de transporte e inventario crecen sin control.',
      'Los proveedores fallan en tiempo o calidad.',
      'Se quiere exportar o abrir operación fuera y no se sabe por dónde empezar.',
    ],
    servicios: [
      { nombre: 'Importación y exportación', resuelve: 'Planear y hacer bien las operaciones de compra y venta internacional.' },
      { nombre: 'Operaciones aduaneras', resuelve: 'Clasificar, documentar y cumplir para que la mercancía no se detenga.' },
      { nombre: 'Gestión logística y transporte', resuelve: 'Elegir rutas, transportistas y tiempos para entregar a menor costo.' },
      { nombre: 'Cadena de suministro', resuelve: 'Coordinar compras, inventario y entregas para no tener ni faltantes ni exceso.' },
      { nombre: 'Negocios internacionales', resuelve: 'Encontrar clientes, socios o proveedores en otros países y negociar con ellos.' },
      { nombre: 'Desarrollo de proveedores', resuelve: 'Encontrar y mejorar proveedores confiables en costo, tiempo y calidad.' },
      { nombre: 'Internacionalización empresarial', resuelve: 'Un plan para llevar la empresa a otros mercados paso a paso.' },
      { nombre: 'Soft landing y expansión comercial', resuelve: 'Acompañar a empresas extranjeras que llegan a México, o a mexicanas que abren fuera.' },
    ],
    beneficios: [
      'Menos retrasos y multas en aduana.',
      'Costos logísticos bajo control.',
      'Nuevos mercados con menos riesgo.',
    ],
    glosario: [
      { termino: 'Clasificación arancelaria', significa: 'El código que define qué impuestos y permisos aplican a una mercancía.' },
      { termino: 'Cadena de suministro', significa: 'Todo el camino de un producto: proveedores, producción, almacenes y entrega.' },
      { termino: 'Soft landing', significa: 'Acompañamiento para que una empresa empiece a operar en un país nuevo sin tropiezos.' },
    ],
  },
]

export function verticalPorSlug(slug: string): Vertical | undefined {
  return VERTICALES.find((v) => v.slug === slug)
}
