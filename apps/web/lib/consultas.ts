import { prisma, type Prisma } from '@aiuto/db'

/**
 * Sólo lo publicado y vigente. Lo demás no existe para el público.
 *
 * Es una función y no una constante porque `new Date()` dentro de un objeto de
 * módulo se evaluaría una sola vez, al cargar: en un servidor que vive días, el
 * corte de vigencia se quedaría congelado en el arranque.
 *
 * El filtro por `expiraEn` es redundante con la tarea de cierre automático, y a
 * propósito: si la tarea se cae o se retrasa, una vacante vencida deja de
 * mostrarse igual. Nadie se postula a algo que ya murió.
 */
export function vacantePublica(ahora = new Date()): Prisma.VacanteWhereInput {
  return {
    estado: 'ABIERTA',
    publicadaEn: { not: null },
    OR: [{ expiraEn: null }, { expiraEn: { gt: ahora } }],
    // Una empresa suspendida deja de recibir postulaciones en ese momento.
    company: { estado: 'APROBADA' },
  }
}

export type FiltrosBolsa = {
  categoria?: string
  /** Texto libre: puesto, empresa, ubicación o conocimientos. */
  q?: string
  modalidad?: string
  /** Piso de sueldo mensual. Se compara contra el máximo de la vacante: quien
   *  pide 30,000 debe ver una vacante de 25,000 a 35,000. */
  desde?: number
  /** Nombre de la empresa, parcial. */
  empresa?: string
  /** Ciudad o estado, parcial. */
  ubicacion?: string
}

const MODALIDADES = ['PRESENCIAL', 'HIBRIDO', 'REMOTO']

/**
 * Compone los filtros bajo un solo `AND`.
 *
 * Es importante que cada condición viva en su propia entrada y no se mezclen en
 * la raíz: `vacantePublica()` ya usa un `OR` para la vigencia, y poner ahí el
 * `OR` de la búsqueda de texto lo pisaría. El resultado sería que al buscar
 * reaparecerían las vacantes vencidas.
 */
export function filtrosDeBusqueda(f: FiltrosBolsa): Prisma.VacanteWhereInput {
  const condiciones: Prisma.VacanteWhereInput[] = [vacantePublica()]

  if (f.categoria) condiciones.push({ category: { slug: f.categoria } })

  if (f.modalidad && MODALIDADES.includes(f.modalidad)) {
    condiciones.push({ modalidad: f.modalidad as Prisma.EnumModalidadFilter['equals'] })
  }

  // El piso de sueldo sólo aplica a vacantes mensuales: compararlo contra un
  // sueldo por hora sin normalizar daría resultados absurdos.
  if (f.desde && f.desde > 0) {
    condiciones.push({ periodicidad: 'MENSUAL', sueldoMax: { gte: f.desde } })
  }

  const empresa = f.empresa?.trim()
  if (empresa) condiciones.push({ company: { nombre: { contains: empresa, mode: 'insensitive' } } })

  const ubicacion = f.ubicacion?.trim()
  if (ubicacion) condiciones.push({ ubicacion: { contains: ubicacion, mode: 'insensitive' } })

  const texto = f.q?.trim()
  if (texto) {
    const contiene = { contains: texto, mode: 'insensitive' } as const
    condiciones.push({
      OR: [
        { puesto: contiene },
        { descripcion: contiene },
        { ubicacion: contiene },
        { conocimientos: { has: texto } },
        { company: { nombre: contiene } },
      ],
    })
  }

  return { AND: condiciones }
}

export async function vacantesAbiertas(filtros: FiltrosBolsa = {}) {
  return prisma.vacante.findMany({
    where: filtrosDeBusqueda(filtros),
    include: { company: true, category: true },
    orderBy: { publicadaEn: 'desc' },
  })
}

export async function vacantePorSlug(slug: string) {
  return prisma.vacante.findFirst({
    where: { slug, ...vacantePublica() },
    include: { company: true, category: true },
  })
}

/**
 * Categorías con resultados. Recibe los filtros activos menos la categoría, para
 * que los conteos de las pestañas correspondan a lo que se está viendo y no al
 * total: un filtro que dice «(3)» y al pulsarlo muestra una es peor que no tener
 * conteo.
 */
export async function categoriasConVacantes(filtros: FiltrosBolsa = {}) {
  const where = filtrosDeBusqueda({ ...filtros, categoria: undefined })
  const categorias = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    include: { _count: { select: { vacantes: { where } } } },
  })
  return categorias.filter((c) => c._count.vacantes > 0)
}

export async function empresaPorSlug(slug: string) {
  return prisma.company.findUnique({
    where: { slug },
    include: {
      vacantes: {
        where: vacantePublica(),
        include: { category: true },
        orderBy: { publicadaEn: 'desc' },
      },
    },
  })
}

/** Empresas que tienen al menos una vacante abierta. */
export async function empresasConVacantes() {
  const empresas = await prisma.company.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { vacantes: { where: vacantePublica() } } } },
  })
  return empresas.filter((e) => e._count.vacantes > 0)
}

/** Lo mínimo para resumir sueldos, agrupado por categoría. */
export async function sueldosPorCategoria() {
  const categorias = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    include: {
      vacantes: {
        where: vacantePublica(),
        select: { sueldoMin: true, sueldoMax: true, periodicidad: true },
      },
    },
  })
  return categorias
}

/** Todo lo de una postulación para verla en detalle. El acceso lo revisa quien llama. */
export async function postulacionDetalle(id: string) {
  return prisma.postulacion.findUnique({
    where: { id },
    include: {
      vacante: { include: { company: true, category: true } },
      candidato: {
        include: {
          user: { select: { nombre: true, email: true } },
          experiencias: { orderBy: { orden: 'asc' } },
          formaciones: { orderBy: { orden: 'asc' } },
          evidencias: { orderBy: { orden: 'asc' } },
        },
      },
      mensajes: { orderBy: { creadoEn: 'asc' }, include: { autor: { select: { nombre: true } } } },
    },
  })
}

export type PostulacionDetalle = NonNullable<Awaited<ReturnType<typeof postulacionDetalle>>>
