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
