/**
 * Run Builder
 * Given a workflow definition, creates Run + NodeExecution records in Postgres
 * and returns the run ID for dispatching to the Runtime service.
 */
import { prisma } from '@flowforge/db'
import type { WorkflowDefinition } from '@flowforge/types'

export interface BuildRunResult {
  runId: string
}

export async function buildRun(
  workflowId: string,
  def: WorkflowDefinition,
  triggeredBy = 'manual',
): Promise<BuildRunResult> {
  // Create the Run record
  const run = await prisma.run.create({
    data: {
      workflowId,
      status: 'PENDING',
      triggeredBy,
      startedAt: new Date(),
    },
  })

  // Create a PENDING NodeExecution for every node in the workflow
  if (def.nodes.length > 0) {
    await prisma.nodeExecution.createMany({
      data: def.nodes.map((node) => ({
        runId: run.id,
        nodeId: node.id,
        status: 'PENDING' as const,
        retries: 0,
      })),
      skipDuplicates: true,
    })
  }

  return { runId: run.id }
}
