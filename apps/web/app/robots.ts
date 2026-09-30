import type { MetadataRoute } from 'next'
import { basePublica } from '@/lib/correo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Nada de esto tiene por qué indexarse: el panel es privado, las ligas de
      // postulación son secretas, y /entrar y /registro no aportan nada en
      // resultados de búsqueda.
      disallow: ['/panel', '/mi', '/api', '/postulacion', '/entrar', '/registro'],
    },
    sitemap: `${basePublica()}/sitemap.xml`,
  }
}
