import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma Client instances in development (hot-reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

// Re-export Prisma types for convenience
export type { Prisma } from '@prisma/client'
export {
  Role,
  RunStatus,
  NodeExecutionStatus,
} from '@prisma/client'
