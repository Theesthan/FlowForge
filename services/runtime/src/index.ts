import { initTracing } from '@flowforge/observability'
initTracing('runtime')

/**
 * Runtime Service (FSM Engine) — port 4002
 *
 * Exposes:
 *   POST /execute   → trigger a run by runId (called by Orchestrator)
 *   POST /resume    → resume a paused run from a HumanGate node
 *   GET  /health    → liveness check
 */
import express from 'express'
import pino from 'pino'
import Redis from 'ioredis'
import { env } from '@flowforge/config'
import { REDIS_CHANNELS } from '@flowforge/types'
import { prisma } from '@flowforge/db'
import { executeRun, continueFromNode } from './fsm/engine'
import { registry, metricsMiddleware, activeRunsGauge, workflowRunOutcomes } from '@flowforge/observability'

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

const PORT = 4002
const redis = new Redis(env.REDIS_URL, { lazyConnect: true })

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis connection error')
})

const app = express()
app.use(express.json())
app.use(metricsMiddleware('runtime'))

// ── Metrics ───────────────────────────────────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType)
  res.end(await registry.metrics())
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'runtime', ts: new Date().toISOString() })
})

// ── Execute run ───────────────────────────────────────────────────────────────
app.post('/execute', async (req, res) => {
  const { runId, triggerInput } = req.body as {
    runId?: string
    triggerInput?: Record<string, unknown>
  }
  if (!runId) {
    res.status(400).json({ error: 'runId is required' })
    return
  }

  // Store trigger input in Redis so the TriggerNode executor can read it
  if (triggerInput && Object.keys(triggerInput).length > 0) {
    await redis.set(`run:${runId}:triggerInput`, JSON.stringify(triggerInput), 'EX', 3600)
  }

  logger.info({ runId }, 'Received execute request')
  res.status(202).json({ runId, accepted: true })

  // Execute in background — delay slightly so frontend can establish WS subscription
  setTimeout(() => {
    activeRunsGauge.inc()
    executeRun(redis, runId)
      .then(() => {
        workflowRunOutcomes.inc({ status: 'SUCCESS' })
      })
      .catch((err: unknown) => {
        workflowRunOutcomes.inc({ status: 'FAILED' })
        logger.error({ err, runId }, 'Unhandled FSM execution error')
        // Best-effort: mark run as FAILED
        prisma.run
          .update({ where: { id: runId }, data: { status: 'FAILED', endedAt: new Date() } })
          .then(() => redis.publish(
            REDIS_CHANNELS.runUpdated(runId),
            JSON.stringify({ runId, status: 'FAILED', updatedAt: new Date().toISOString() }),
          ))
          .catch(() => {})
      })
      .finally(() => {
        activeRunsGauge.dec()
      })
  }, 800)  // 800ms delay — gives frontend time to establish WebSocket subscription
})

// ── Resume paused run (HumanGate approval) ────────────────────────────────────
app.post('/resume', async (req, res) => {
  const { runId, approvedOutput } = req.body as {
    runId?: string
    approvedOutput?: Record<string, unknown>
  }
  if (!runId) {
    res.status(400).json({ error: 'runId is required' })
    return
  }

  const run = await prisma.run.findUnique({ where: { id: runId } })
  if (!run || run.status !== 'PAUSED') {
    res.status(400).json({ error: 'Run is not in PAUSED state' })
    return
  }

  const pausedNodeId = run.pausedNodeId
  if (!pausedNodeId) {
    res.status(400).json({ error: 'Run has no paused node' })
    return
  }

  // Mark the HumanGate NodeExecution as SUCCESS with approved output
  await prisma.nodeExecution.updateMany({
    where: { runId, nodeId: pausedNodeId, status: 'RUNNING' },
    data: {
      status: 'SUCCESS',
      output: (approvedOutput ?? {}) as object,
      endedAt: new Date(),
    },
  })

  // Resume run
  await prisma.run.update({
    where: { id: runId },
    data: { status: 'RUNNING', pausedNodeId: null, pausedState: undefined },
  })

  logger.info({ runId, pausedNodeId }, 'Resuming paused run')
  res.status(202).json({ runId, resumed: true })

  // Continue from the successors of the paused node (not from the beginning)
  setImmediate(() => {
    continueFromNode(redis, runId, pausedNodeId).catch((err: unknown) => {
      logger.error({ err, runId }, 'Unhandled FSM resume error')
    })
  })
})

// ── Connect Redis then start HTTP ─────────────────────────────────────────────
async function start(): Promise<void> {
  await redis.connect()
  app.listen(PORT, () => {
    logger.info(`⚡ Runtime (FSM) → http://localhost:${PORT}`)
  })
}

start().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start Runtime service')
  process.exit(1)
})
