import { prisma } from '@flowforge/db'
import type { GraphQLContext } from '@flowforge/types'

interface CreateWorkflowInput {
  orgId: string
  name: string
  description?: string
  definition?: unknown
}

interface UpdateWorkflowInput {
  name?: string
  description?: string
  definition?: unknown
}

interface CreateOrganizationInput {
  name: string
  slug: string
}

export const mutationResolvers = {
  createOrganization: async (
    _: unknown,
    { input }: { input: CreateOrganizationInput },
    ctx: GraphQLContext
  ) => {
    if (!ctx.userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({ where: { firebaseUid: ctx.userId } })
    if (!user) throw new Error('User not found')

    return prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        memberships: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
    })
  },

  createWorkflow: async (
    _: unknown,
    { input }: { input: CreateWorkflowInput }
  ) => {
    const workflow = await prisma.workflow.create({
      data: {
        orgId: input.orgId,
        name: input.name,
        description: input.description,
        definition: (input.definition as object) ?? { nodes: [], edges: [] },
        currentVersion: 1,
      },
    })

    // Record initial version snapshot
    await prisma.workflowVersion.create({
      data: {
        workflowId: workflow.id,
        definition: workflow.definition,
        version: 1,
      },
    })

    return workflow
  },

  updateWorkflow: async (
    _: unknown,
    { id, input }: { id: string; input: UpdateWorkflowInput }
  ) => {
    const existing = await prisma.workflow.findFirstOrThrow({ where: { id, deletedAt: null } })

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        definition: (input.definition as object) ?? existing.definition,
        currentVersion: { increment: 1 },
      },
    })

    // Record new version snapshot when definition changes
    if (input.definition !== undefined) {
      await prisma.workflowVersion.create({
        data: {
          workflowId: id,
          definition: input.definition as object,
          version: updated.currentVersion,
        },
      })
    }

    return updated
  },

  deleteWorkflow: async (_: unknown, { id }: { id: string }): Promise<boolean> => {
    await prisma.workflow.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    return true
  },

  triggerRun: async (
    _: unknown,
    { workflowId, triggeredBy }: { workflowId: string; triggeredBy?: string }
  ) => {
    return prisma.run.create({
      data: {
        workflowId,
        status: 'PENDING',
        triggeredBy: triggeredBy ?? 'manual',
      },
    })
  },

  pauseRun: async (_: unknown, { runId }: { runId: string }) => {
    return prisma.run.update({
      where: { id: runId },
      data: { status: 'PAUSED' },
    })
  },

  resumeRun: async (_: unknown, { runId }: { runId: string }) => {
    return prisma.run.update({
      where: { id: runId },
      data: { status: 'RUNNING' },
    })
  },

  cancelRun: async (_: unknown, { runId }: { runId: string }) => {
    return prisma.run.update({
      where: { id: runId },
      data: { status: 'CANCELLED', endedAt: new Date() },
    })
  },
}
