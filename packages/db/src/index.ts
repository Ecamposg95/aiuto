import { PrismaClient } from '@prisma/client'

// Una sola instancia. En desarrollo Next.js recarga el módulo en cada cambio y
// sin esto se abren conexiones hasta agotar el pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export * from '@prisma/client'
