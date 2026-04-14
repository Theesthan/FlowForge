/**
 * FSM Execution Engine
 *
 * Lifecycle per node: PENDING → RUNNING → SUCCESS | FAILED | FALLBACK
 * Supports:
 *   - Fan-out (parallel branches from one node)
 *   - Fan-in (merge: waits for all predecessors)
 *   - Retry with exponential backoff (up to config.maxRetries, default 3)
 *   - Fallback output on exhausted retries
 *   - HumanGate pause / resume via Redis + Postgres state
 *   - Per-node log streaming via Redis pub/sub
 */
import pino from 'pino'
import Redis from 'ioredis'
import { prisma } from '@flowforge/db'
import { REDIS_CHANNELS } from '@flowforge/types'
import type { WorkflowDefinition, NodeExecutionStatus, WorkflowNode, WorkflowNodeConfig } from '@flowforge/types'
import { getEntryNodes, getSuccessors, getPredecessors } from './dag'
import { getExecutor } from '../executors/index'
import type { ExecutorResult } from '../executors/index'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// ── Redis pub/sub helpers ─────────────────────────────────────────────────────

async function emitRunUpdated(redis: Redis, runId: string, status: string): Promise<void> {
  await redis.publish(
    REDIS_CHANNELS.runUpdated(runId),
    JSON.stringify({ runId, status, updatedAt: new Date().toISOString() }),
  )
}

async function emitNodeUpdated(
  redis: Redis,
  runId: string,
  nodeId: string,
  nodeExecutionId: string,
  status: NodeExecutionStatus,
  retries: number,
  output?: Record<string, unknown>,
): Promise<void> {
  await redis.publish(
    REDIS_CHANNELS.nodeExecutionUpdated(runId),
    JSON.stringify({ runId, nodeId, nodeExecutionId, status, retries, output, updatedAt: new Date().toISOString() }),
  )
}

// ── Node execution with retry + fallback ─────────────────────────────────────

interface NodeRunResult {
  success: boolean
  usedFallback: boolean
  paused: boolean
  output: Record<string, unknown>
  conditionResult?: string
}

async function runNode(
  redis: Redis,
  runId: string,
  orgId: string,
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<NodeRunResult> {
  const maxRetries = node.config.maxRetries ?? 3
  const nodeExec = await prisma.nodeExecution.findFirst({ where: { runId, nodeId: node.id } })
  if (!nodeExec) throw new Error(`NodeExecution not found for node ${node.id} in run ${runId}`)

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Update status to RUNNING
    const updated = await prisma.nodeExecution.update({
      where: { id: nodeExec.id },
      data: {
        status: 'RUNNING',
        retries: attempt,
        startedAt: attempt === 0 ? new Date() : undefined,
        input: input as object,
      },
    })

    await emitNodeUpdated(redis, runId, node.id, updated.id, 'RUNNING', attempt)
    logger.debug({ runId, nodeId: node.id, attempt }, 'Executing node')

    try {
      const executor = getExecutor(node.type)
      const result: ExecutorResult = await executor.execute(node.config, input, {
        runId,
        nodeId: node.id,
        orgId,
        emitLog: async (token: string) => {
          await redis.publish(
            REDIS_CHANNELS.nodeLog(runId, node.id),
            JSON.stringify({ token, timestamp: new Date().toISOString() }),
          )
        },
      })

      // Pause requested by HumanGateNode
      if (result.pause) {
        await prisma.nodeExecution.update({
          where: { id: nodeExec.id },
          data: { status: 'RUNNING', output: result.output as object },
        })
        await prisma.run.update({
          where: { id: runId },
          data: { status: 'PAUSED', pausedNodeId: node.id, pausedState: { nodeId: node.id, input } as object },
        })
        await emitRunUpdated(redis, runId, 'PAUSED')
        return { success: false, usedFallback: false, paused: true, output: result.output }
      }

      // SUCCESS
      const finalExec = await prisma.nodeExecution.update({
        where: { id: nodeExec.id },
        data: { status: 'SUCCESS', output: result.output as object, endedAt: new Date() },
      })
      await emitNodeUpdated(redis, runId, node.id, finalExec.id, 'SUCCESS', attempt, result.output)

      return {
        success: true,
        usedFallback: false,
        paused: false,
        output: result.output,
        conditionResult: result.conditionResult,
      }
    } catch (err) {
      lastError = err
      logger.warn({ runId, nodeId: node.id, attempt, err }, 'Node execution failed')

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000
        await sleep(backoffMs)
        continue
      }
    }
  }

  // All retries exhausted — try fallback
  if (node.config.fallbackOutput) {
    const fallback = node.config.fallbackOutput as Record<string, unknown>
    const fallbackExec = await prisma.nodeExecution.update({
      where: { id: nodeExec.id },
      data: {
        status: 'FALLBACK',
        output: fallback as object,
        error: String(lastError),
        endedAt: new Date(),
      },
    })
    await emitNodeUpdated(redis, runId, node.id, fallbackExec.id, 'FALLBACK', maxRetries, fallback)
    return { success: false, usedFallback: true, paused: false, output: fallback }
  }

  // Hard failure
  const failedExec = await prisma.nodeExecution.update({
    where: { id: nodeExec.id },
    data: {
      status: 'FAILED',
      error: String(lastError),
      endedAt: new Date(),
    },
  })
  await emitNodeUpdated(redis, runId, node.id, failedExec.id, 'FAILED', maxRetries)

  return { success: false, usedFallback: false, paused: false, output: {} }
}

// ── Shared types ──────────────────────────────────────────────────────────────

type NodeState = 'pending' | 'running' | 'success' | 'failed' | 'fallback' | 'skipped'

// ── Shared workflow loader ────────────────────────────────────────────────────

async function loadWorkflowDef(runId: string): Promise<{
  orgId: string
  def: WorkflowDefinition
  nodeMap: Map<string, WorkflowNode>
  nodeIds: string[]
} | null> {
  const run = await prisma.run.findUnique({ where: { id: runId } })
  if (!run) { logger.error({ runId }, 'Run not found'); return null }

  const workflow = await prisma.workflow.findUnique({ where: { id: run.workflowId } })
  if (!workflow) { logger.error({ runId }, 'Workflow not found'); return null }

  const orgId = workflow.orgId
  const rawDef = workflow.definition
  const parsedDef = typeof rawDef === 'string'
    ? (JSON.parse(rawDef) as WorkflowDefinition)
    : (rawDef as unknown as WorkflowDefinition)

  const normalizedNodes: WorkflowNode[] = parsedDef.nodes.map((n) => {
    const nodeAny = n as unknown as Record<string, unknown>
    if (n.config) return n
    const data = (nodeAny['data'] ?? {}) as Record<string, unknown>
    const { label, status: _status, ...config } = data
    return {
      ...n,
      label: (label as string) ?? n.id,
      config: config as WorkflowNodeConfig,
    } as WorkflowNode
  })

  // React Flow serializes ConditionNode edges with sourceHandle: 'true'|'false'.
  // Map that to WorkflowEdge.condition so getSuccessors() can route correctly.
  const normalizedEdges = parsedDef.edges.map((e) => {
    const edgeAny = e as unknown as Record<string, unknown>
    const sourceHandle = edgeAny['sourceHandle'] as string | undefined
    return {
      ...e,
      condition: e.condition ?? sourceHandle ?? undefined,
    }
  })

  const def: WorkflowDefinition = { ...parsedDef, nodes: normalizedNodes, edges: normalizedEdges }
  const nodeMap = new Map(def.nodes.map((n) => [n.id, n]))
  const nodeIds = def.nodes.map((n) => n.id)
  return { orgId, def, nodeMap, nodeIds }
}

// ── Shared FSM execution loop ─────────────────────────────────────────────────

async function runFSMLoop(
  redis: Redis,
  runId: string,
  orgId: string,
  def: WorkflowDefinition,
  nodeMap: Map<string, WorkflowNode>,
  nodeState: Map<string, NodeState>,
  nodeOutput: Map<string, Record<string, unknown>>,
  initialQueue: Set<string>,
): Promise<void> {
  let hardFailed = false
  const queue = new Set<string>(initialQueue)

  while (queue.size > 0 && !hardFailed) {
    const batch = [...queue]
    queue.clear()

    await Promise.all(
      batch.map(async (nodeId) => {
        const node = nodeMap.get(nodeId)
        if (!node) return

        nodeState.set(nodeId, 'running')

        const preds = getPredecessors(nodeId, def.edges)
        const input: Record<string, unknown> = {}
        for (const predId of preds) {
          const out = nodeOutput.get(predId) ?? {}
          Object.assign(input, out)
        }

        const result = await runNode(redis, runId, orgId, node, input)

        if (result.paused) {
          hardFailed = true
          return
        }

        if (!result.success && !result.usedFallback) {
          nodeState.set(nodeId, 'failed')
          if (node.config.hardFail) {
            logger.error({ runId, nodeId }, 'Hard-fail node failed — aborting run')
            hardFailed = true
          }
          return
        }

        nodeState.set(nodeId, result.usedFallback ? 'fallback' : 'success')
        nodeOutput.set(nodeId, result.output)

        const successors = getSuccessors(nodeId, def.edges, result.conditionResult)
        for (const succId of successors) {
          const succPreds = getPredecessors(succId, def.edges)
          const allDone = succPreds.every((p) => {
            const s = nodeState.get(p)
            return s === 'success' || s === 'fallback' || s === 'failed'
          })
          if (allDone && nodeState.get(succId) === 'pending') {
            queue.add(succId)
          }
        }
      }),
    )
  }

  // Finalize run status
  if (hardFailed) {
    const currentRun = await prisma.run.findUnique({ where: { id: runId } })
    if (currentRun?.status === 'PAUSED') return
  }

  const anyFailed = [...nodeState.values()].some((s) => s === 'failed')
  const finalStatus = hardFailed ? 'FAILED' : anyFailed ? 'FAILED' : 'SUCCESS'

  await prisma.run.update({ where: { id: runId }, data: { status: finalStatus, endedAt: new Date() } })
  await emitRunUpdated(redis, runId, finalStatus)
  logger.info({ runId, finalStatus }, 'FSM: run complete')
}

// ── Main FSM execution loop ───────────────────────────────────────────────────

export async function executeRun(redis: Redis, runId: string): Promise<void> {
  logger.info({ runId }, 'FSM: starting run')

  const loaded = await loadWorkflowDef(runId)
  if (!loaded) return
  const { orgId, def, nodeMap, nodeIds } = loaded

  // Mark run as RUNNING
  await prisma.run.update({ where: { id: runId }, data: { status: 'RUNNING', startedAt: new Date() } })
  await emitRunUpdated(redis, runId, 'RUNNING')

  const nodeState = new Map<string, NodeState>(nodeIds.map((id) => [id, 'pending']))
  const nodeOutput = new Map<string, Record<string, unknown>>()

  // Queue starts with entry nodes (no predecessors)
  const ready = getEntryNodes(nodeIds, def.edges)
  const queue = new Set<string>(ready)

  await runFSMLoop(redis, runId, orgId, def, nodeMap, nodeState, nodeOutput, queue)
}

// ── Resume from a paused HumanGate node ──────────────────────────────────────

export async function continueFromNode(redis: Redis, runId: string, resumedNodeId: string): Promise<void> {
  logger.info({ runId, resumedNodeId }, 'FSM: resuming run from node')

  const loaded = await loadWorkflowDef(runId)
  if (!loaded) return
  const { orgId, def, nodeMap, nodeIds } = loaded

  // Reconstruct nodeState + nodeOutput from existing NodeExecution records
  const existingExecs = await prisma.nodeExecution.findMany({ where: { runId } })
  const execByNodeId = new Map(existingExecs.map((e) => [e.nodeId, e]))

  const nodeState = new Map<string, NodeState>()
  const nodeOutput = new Map<string, Record<string, unknown>>()

  for (const id of nodeIds) {
    const exec = execByNodeId.get(id)
    if (!exec || exec.status === 'PENDING' || exec.status === 'RUNNING') {
      nodeState.set(id, 'pending')
    } else if (exec.status === 'SUCCESS') {
      nodeState.set(id, 'success')
      nodeOutput.set(id, (exec.output ?? {}) as Record<string, unknown>)
    } else if (exec.status === 'FAILED') {
      nodeState.set(id, 'failed')
    } else if (exec.status === 'FALLBACK') {
      nodeState.set(id, 'fallback')
      nodeOutput.set(id, (exec.output ?? {}) as Record<string, unknown>)
    } else {
      nodeState.set(id, 'pending')
    }
  }

  // Mark run as RUNNING again
  await prisma.run.update({ where: { id: runId }, data: { status: 'RUNNING', pausedNodeId: null } })
  await emitRunUpdated(redis, runId, 'RUNNING')

  // Seed queue with successors of the resumed node that are ready
  const queue = new Set<string>()
  const successors = getSuccessors(resumedNodeId, def.edges)
  for (const succId of successors) {
    const succPreds = getPredecessors(succId, def.edges)
    const allDone = succPreds.every((p) => {
      const s = nodeState.get(p)
      return s === 'success' || s === 'fallback' || s === 'failed'
    })
    if (allDone && nodeState.get(succId) === 'pending') {
      queue.add(succId)
    }
  }

  if (queue.size === 0) {
    // No successors — workflow is complete
    const anyFailed = [...nodeState.values()].some((s) => s === 'failed')
    const finalStatus = anyFailed ? 'FAILED' : 'SUCCESS'
    await prisma.run.update({ where: { id: runId }, data: { status: finalStatus, endedAt: new Date() } })
    await emitRunUpdated(redis, runId, finalStatus)
    logger.info({ runId, finalStatus }, 'FSM: run complete after resume (no successors)')
    return
  }

  await runFSMLoop(redis, runId, orgId, def, nodeMap, nodeState, nodeOutput, queue)
}
