import type { MetadataRoute } from 'next'
import { prisma } from '@aiuto/db'
import { VERTICALES } from '@aiuto/core'
import { vacantePublica } from '@/lib/consultas'
import { basePublica } from '@/lib/correo'

// Las vacantes nacen y vencen todo el tiempo: el mapa se arma en cada petición.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = basePublica()

  const [vacantes, empresas] = await Promise.all([
    prisma.vacante.findMany({
      where: vacantePublica(),
      select: { slug: true, actualizadoEn: true },
    }),
    prisma.company.findMany({
      where: { vacantes: { some: vacantePublica() } },
      select: { slug: true, creadoEn: true },
    }),
  ])

  const fijas: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/bolsa`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/sueldos`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/nosotros`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/soluciones`, changeFrequency: 'monthly', priority: 0.9 },
    ...VERTICALES.map((v) => ({ url: `${base}/soluciones/${v.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${base}/empleabilidad`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/empresas/registro`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  return [
    ...fijas,
    ...vacantes.map((v) => ({
      url: `${base}/bolsa/${v.slug}`,
      lastModified: v.actualizadoEn,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...empresas.map((e) => ({
      url: `${base}/empresa/${e.slug}`,
      lastModified: e.creadoEn,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
