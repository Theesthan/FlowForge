import { prisma } from '@flowforge/db'
import type { GraphQLContext } from '@flowforge/types'

// Explicit type breaks Prisma type inference chain (TS2742)
export const queryResolvers: Record<string, unknown> = {
  me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) return null
    return prisma.user.findUnique({ where: { firebaseUid: ctx.userId } })
  },

  listOrganizations: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
    if (!ctx.userId) return []
    const user = await prisma.user.findUnique({
      where: { firebaseUid: ctx.userId },
      include: { memberships: { include: { organization: true } } },
    })
    return user?.memberships.map((m) => m.organization) ?? []
  },

  getOrganization: async (_: unknown, { id }: { id: string }) => {
    return prisma.organization.findUnique({ where: { id } })
  },

  listWorkflows: async (_: unknown, { orgId }: { orgId: string }) => {
    return prisma.workflow.findMany({
      where: { orgId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    })
  },

  getWorkflow: async (_: unknown, { id }: { id: string }) => {
    return prisma.workflow.findFirst({ where: { id, deletedAt: null } })
  },

  listWorkflowVersions: async (_: unknown, { workflowId }: { workflowId: string }) => {
    return prisma.workflowVersion.findMany({
      where: { workflowId },
      orderBy: { version: 'desc' },
    })
  },

  listRuns: async (_: unknown, { workflowId }: { workflowId: string }) => {
    return prisma.run.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { nodeExecutions: { orderBy: { createdAt: 'asc' } } },
    })
  },

  getRun: async (_: unknown, { id }: { id: string }) => {
    return prisma.run.findUnique({
      where: { id },
      include: { nodeExecutions: { orderBy: { createdAt: 'asc' } } },
    })
  },

  listTemplates: async () => {
    return prisma.template.findMany({
      where: { isPublic: true },
      orderBy: { name: 'asc' },
    })
  },

  getTemplate: async (_: unknown, { id }: { id: string }) => {
    return prisma.template.findUnique({ where: { id } })
  },
}
