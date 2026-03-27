import { prisma } from '@flowforge/db'
import type { GraphQLContext } from '@flowforge/types'

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? 'http://localhost:4001'
const RUNTIME_URL = process.env.RUNTIME_URL ?? 'http://localhost:4002'

async function dispatchToOrchestrator(workflowId: string, triggeredBy: string): Promise<string | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, triggeredBy }),
    })
    if (!res.ok) return null
    const json = await res.json() as { runId?: string }
    return json.runId ?? null
  } catch {
    return null
  }
}

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

// Explicit type breaks Prisma type inference chain (TS2742)
export const mutationResolvers: Record<string, unknown> = {
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
        definition: workflow.definition as object,
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

  /**
   * createRun — frontend-facing alias used by use-workflow-run.ts.
   * Delegates to Orchestrator which validates the DAG, creates DB records,
   * and dispatches to the FSM Runtime service.
   */
  createRun: async (
    _: unknown,
    { workflowId }: { workflowId: string },
    ctx: GraphQLContext,
  ) => {
    const runId = await dispatchToOrchestrator(workflowId, ctx.userId ?? 'manual')
    if (runId) {
      return prisma.run.findUniqueOrThrow({ where: { id: runId } })
    }
    // Fallback: create a stub run record if orchestrator is unreachable
    return prisma.run.create({
      data: { workflowId, status: 'PENDING', triggeredBy: ctx.userId ?? 'manual' },
    })
  },

  triggerRun: async (
    _: unknown,
    { workflowId, triggeredBy }: { workflowId: string; triggeredBy?: string },
    ctx: GraphQLContext,
  ) => {
    const runId = await dispatchToOrchestrator(workflowId, triggeredBy ?? ctx.userId ?? 'manual')
    if (runId) {
      return prisma.run.findUniqueOrThrow({ where: { id: runId } })
    }
    return prisma.run.create({
      data: { workflowId, status: 'PENDING', triggeredBy: triggeredBy ?? 'manual' },
    })
  },

  pauseRun: async (_: unknown, { runId }: { runId: string }) => {
    return prisma.run.update({
      where: { id: runId },
      data: { status: 'PAUSED' },
    })
  },

  resumeRun: async (
    _: unknown,
    { runId, approvedOutput }: { runId: string; approvedOutput?: Record<string, unknown> },
  ) => {
    // Forward to Runtime service which will mark the HumanGate NodeExecution
    // as SUCCESS and re-execute the FSM from where it left off
    try {
      await fetch(`${RUNTIME_URL}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, approvedOutput: approvedOutput ?? {} }),
      })
    } catch {
      // Runtime unreachable — fall through to DB-only update (degraded mode)
    }
    return prisma.run.findUniqueOrThrow({ where: { id: runId } })
  },

  cancelRun: async (_: unknown, { runId }: { runId: string }) => {
    return prisma.run.update({
      where: { id: runId },
      data: { status: 'CANCELLED', endedAt: new Date() },
    })
  },
}
