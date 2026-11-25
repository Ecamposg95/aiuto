/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El monorepo comparte paquetes por código fuente, no compilados.
  transpilePackages: ['@aiuto/core', '@aiuto/db'],
  // Salida autocontenida: es lo que hace liviana la imagen de Docker y lo que
  // permite que la misma imagen corra en Railway y después en el VPS de IONOS.
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,

  // El motor de consultas de Prisma es un binario .node: el rastreo de archivos
  // no lo sigue solo y sin él la aplicación arranca pero no alcanza la base.
  outputFileTracingIncludes: {
    '/**': ['../../packages/db/generated/client/**/*.node'],
  },

  // Cabeceras para todas las respuestas. Referrer-Policy importa más de lo que
  // parece: las ligas /postulacion/<token> son secretas y, sin ella, viajarían
  // completas en el Referer hacia cualquier sitio externo que se enlace.
  // No se pone CSP todavía: Next mete scripts en línea y una CSP a medias rompe
  // la página sin proteger nada.
  // /asesoria se volvió /empleabilidad (máster prompt §12). Las ligas viejas
  // siguen llegando.
  async redirects() {
    return [{ source: '/asesoria', destination: '/empleabilidad', permanent: true }]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // `packages/core` importa con extensión .js, que es lo correcto en ESM y lo que
  // le permitirá correr en Node sin bundler el día que se extraiga la API. El
  // bundler necesita que se le diga que ese .js es un .ts en disco.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    }
    return config
  },
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
  },
}

export default nextConfig
