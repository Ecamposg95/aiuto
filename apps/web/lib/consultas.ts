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
  }
}

export async function vacantesAbiertas(categoria?: string) {
  return prisma.vacante.findMany({
    where: {
      ...vacantePublica(),
      ...(categoria ? { category: { slug: categoria } } : {}),
    },
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

export async function categoriasConVacantes() {
  const categorias = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    include: { _count: { select: { vacantes: { where: vacantePublica() } } } },
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
