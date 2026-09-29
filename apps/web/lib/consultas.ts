import { prisma } from '@aiuto/db'

/** Sólo lo publicado y vigente. Lo demás no existe para el público. */
export const VACANTE_PUBLICA = { estado: 'ABIERTA', publicadaEn: { not: null } } as const

export async function vacantesAbiertas(categoria?: string) {
  return prisma.vacante.findMany({
    where: {
      ...VACANTE_PUBLICA,
      ...(categoria ? { category: { slug: categoria } } : {}),
    },
    include: { company: true, category: true },
    orderBy: { publicadaEn: 'desc' },
  })
}

export async function vacantePorSlug(slug: string) {
  return prisma.vacante.findFirst({
    where: { slug, ...VACANTE_PUBLICA },
    include: { company: true, category: true },
  })
}

export async function categoriasConVacantes() {
  const categorias = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    include: { _count: { select: { vacantes: { where: VACANTE_PUBLICA } } } },
  })
  return categorias.filter((c) => c._count.vacantes > 0)
}
