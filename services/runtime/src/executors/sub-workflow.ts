/**
 * SubWorkflowNode executor
 *
 * Recursively dispatches another workflow as a subroutine via the Orchestrator.
 * Polls Postgres until the sub-run reaches a terminal state (SUCCESS / FAILED / CANCELLED)
 * then returns its final output.
 *
 * Input/output mapping (optional):
 *   config.inputMap  — maps keys from THIS node's input to the sub-workflow's trigger input.
 *                      e.g. { "query": "input.searchQuery" }
 *   config.outputMap — maps keys from the sub-run's final node output back to THIS node's output.
 *                      e.g. { "result": "output.summary" }
 *
 * Timeouts:
 *   - Poll interval: 2 seconds
 *   - Max wait: 10 minutes (configurable via SUB_WORKFLOW_TIMEOUT_MS env var)
 */
import pino from 'pino'
import { prisma } from '@flowforge/db'
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? 'http://localhost:4001'
const POLL_INTERVAL_MS = 2_000
const MAX_WAIT_MS = Number(process.env.SUB_WORKFLOW_TIMEOUT_MS ?? 10 * 60 * 1000)
const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED', 'CANCELLED'])

function buildSubInput(
  input: Record<string, unknown>,
  inputMap?: Record<string, string>,
): Record<string, unknown> {
  if (!inputMap || Object.keys(inputMap).length === 0) return input

  const result: Record<string, unknown> = {}
  for (const [subKey, sourcePath] of Object.entries(inputMap)) {
    // sourcePath like "input.someField" or just "someField"
    const parts = sourcePath.startsWith('input.')
      ? sourcePath.slice('input.'.length).split('.')
      : sourcePath.split('.')
    let value: unknown = input
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part]
    }
    result[subKey] = value
  }
  return result
}

function buildOutput(
  runOutput: Record<string, unknown>,
  outputMap?: Record<string, string>,
): Record<string, unknown> {
  if (!outputMap || Object.keys(outputMap).length === 0) return runOutput

  const result: Record<string, unknown> = {}
  for (const [outKey, sourcePath] of Object.entries(outputMap)) {
    const parts = sourcePath.startsWith('output.')
      ? sourcePath.slice('output.'.length).split('.')
      : sourcePath.split('.')
    let value: unknown = runOutput
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part]
    }
    result[outKey] = value
  }
  return result
}

async function dispatchSubRun(
  subWorkflowId: string,
  triggeredBy: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId: subWorkflowId, triggeredBy }),
    })
    if (!res.ok) return null
    const json = await res.json() as { runId?: string }
    return json.runId ?? null
  } catch (err: unknown) {
    logger.error({ err, subWorkflowId }, 'SubWorkflow: failed to dispatch')
    return null
  }
}

async function pollUntilDone(runId: string): Promise<Record<string, unknown> | null> {
  const deadline = Date.now() + MAX_WAIT_MS
  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

  while (Date.now() < deadline) {
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        nodeExecutions: {
          where: { status: 'SUCCESS' },
          orderBy: { endedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!run) return null

    if (TERMINAL_STATUSES.has(run.status)) {
      if (run.status === 'SUCCESS') {
        // Return the output of the last successful node execution
        const lastOutput = run.nodeExecutions[0]?.output as Record<string, unknown> | null
        return lastOutput ?? { subRunId: runId, status: 'SUCCESS' }
      }
      // FAILED or CANCELLED
      throw new Error(`Sub-workflow run ${runId} ended with status ${run.status}`)
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(`Sub-workflow run ${runId} timed out after ${MAX_WAIT_MS / 1000}s`)
}

export const subWorkflowExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
    context,
  ): Promise<ExecutorResult> {
    const { subWorkflowId, inputMap, outputMap } = config

    if (!subWorkflowId) {
      throw new Error('SubWorkflowNode: subWorkflowId is required')
    }

    await context.emitLog(`[SubWorkflow] Dispatching sub-workflow ${subWorkflowId}…\n`)

    const subInput = buildSubInput(input, inputMap)
    const runId = await dispatchSubRun(subWorkflowId, `subworkflow:${context.runId}`)

    if (!runId) {
      throw new Error(`SubWorkflowNode: failed to create run for workflow ${subWorkflowId}`)
    }

    await context.emitLog(`[SubWorkflow] Run created: ${runId} — polling for completion…\n`)

    const subOutput = await pollUntilDone(runId)
    if (!subOutput) {
      throw new Error(`SubWorkflowNode: run ${runId} not found`)
    }

    await context.emitLog(`[SubWorkflow] Run ${runId} completed.\n`)

    const mappedOutput = buildOutput(subOutput, outputMap)

    return {
      output: {
        subRunId: runId,
        subWorkflowId,
        ...mappedOutput,
      },
    }
  },
}
