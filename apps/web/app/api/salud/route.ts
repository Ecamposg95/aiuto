import { prisma } from '@aiuto/db'

// Nunca cachear: un chequeo de salud cacheado miente.
export const dynamic = 'force-dynamic'

/**
 * Chequeo de salud para Railway. Verifica que la aplicación responde *y* que
 * alcanza la base: un proceso vivo sin base no está sano, está engañando al
 * balanceador.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ estado: 'ok', base: 'ok' })
  } catch (error) {
    console.error('Chequeo de salud: la base no responde', error)
    return Response.json({ estado: 'degradado', base: 'sin conexión' }, { status: 503 })
  }
}
