import { initTracing } from '@flowforge/observability'
initTracing('orchestrator')

/**
 * Orchestrator Service — port 4001
 *
 * Responsibilities:
 *   - DAG validation (cycle detection, required field checks)
 *   - Run creation: persists Run + NodeExecution records in Postgres
 *   - Dispatches execution to the Runtime service (POST /execute)
 */
import express from 'express'
import pino from 'pino'
import { env } from '@flowforge/config'
import type { WorkflowDefinition } from '@flowforge/types'
import { validateDAG } from './dag-validator'
import { buildRun } from './run-builder'
import { prisma } from '@flowforge/db'
import { startScheduler } from './scheduler'
import { registerWebhookRoutes } from './webhook-handler'
import { registry, metricsMiddleware, workflowRunsTotal } from '@flowforge/observability'

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

const PORT = 4001
const RUNTIME_URL = process.env.RUNTIME_URL ?? 'http://localhost:4002'

const app = express()
app.use(express.json())
app.use(metricsMiddleware('orchestrator'))

// ── Metrics ───────────────────────────────────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType)
  res.end(await registry.metrics())
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orchestrator', ts: new Date().toISOString() })
})

// ── DAG validation ────────────────────────────────────────────────────────────
app.post('/validate', (req, res) => {
  const def = req.body as WorkflowDefinition
  if (!def || typeof def !== 'object') {
    res.status(400).json({ valid: false, errors: ['Request body must be a WorkflowDefinition'] })
    return
  }
  const result = validateDAG(def)
  logger.info({ valid: result.valid, errorCount: result.errors.length }, 'DAG validation')
  res.json(result)
})

// ── Trigger run ───────────────────────────────────────────────────────────────
app.post('/runs', async (req, res) => {
  const { workflowId, triggeredBy } = req.body as {
    workflowId?: string
    triggeredBy?: string
  }

  if (!workflowId) {
    res.status(400).json({ error: 'workflowId is required' })
    return
  }

  try {
    // Load the workflow definition from DB
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, deletedAt: null },
    })

    if (!workflow) {
      res.status(404).json({ error: `Workflow ${workflowId} not found` })
      return
    }

    const rawDef = workflow.definition
    const def: WorkflowDefinition = typeof rawDef === 'string'
      ? (JSON.parse(rawDef) as WorkflowDefinition)
      : (rawDef as unknown as WorkflowDefinition)

    // Validate DAG before running
    const validation = validateDAG(def)
    if (!validation.valid) {
      res.status(422).json({ error: 'DAG validation failed', errors: validation.errors })
      return
    }

    // Build run + node execution records
    const { runId } = await buildRun(workflowId, def, triggeredBy ?? 'manual')
    workflowRunsTotal.inc({ triggered_by: triggeredBy ?? 'manual' })
    logger.info({ runId, workflowId }, 'Run created — dispatching to runtime')

    // Dispatch to Runtime service (fire-and-forget — don't block response)
    fetch(`${RUNTIME_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, workflowId }),
    }).catch((err: unknown) => {
      logger.error({ err, runId }, 'Failed to dispatch run to runtime')
    })

    res.status(202).json({ runId, status: 'PENDING' })
  } catch (err) {
    logger.error({ err }, 'Error creating run')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ── Webhook trigger routes ─────────────────────────────────────────────────────
registerWebhookRoutes(app, async (workflowId, input) => {
  try {
    const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, deletedAt: null } })
    if (!workflow) return
    const rawDef1 = workflow.definition
    const def = typeof rawDef1 === 'string' ? (JSON.parse(rawDef1) as WorkflowDefinition) : (rawDef1 as unknown as WorkflowDefinition)
    const { runId } = await buildRun(workflowId, def, 'webhook')
    // Attach trigger input to run metadata via Redis or just dispatch with initial input
    fetch(`${RUNTIME_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, triggerInput: input }),
    }).catch((err: unknown) => logger.error({ err, runId }, 'Failed to dispatch webhook run'))
  } catch (err: unknown) {
    logger.error({ err, workflowId }, 'Webhook trigger dispatch error')
  }
})

app.listen(PORT, () => {
  logger.info(`⚙️  Orchestrator → http://localhost:${PORT}`)

  // Start trigger scheduler (cron + RSS) after server is ready
  startScheduler(async (workflowId, input) => {
    try {
      const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, deletedAt: null } })
      if (!workflow) return
      const rawDef2 = workflow.definition
      const def = typeof rawDef2 === 'string' ? (JSON.parse(rawDef2) as WorkflowDefinition) : (rawDef2 as unknown as WorkflowDefinition)
      const { runId } = await buildRun(workflowId, def, 'scheduler')
      fetch(`${RUNTIME_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, triggerInput: input }),
      }).catch((err: unknown) => logger.error({ err, runId }, 'Failed to dispatch scheduled run'))
    } catch (err: unknown) {
      logger.error({ err, workflowId }, 'Scheduler dispatch error')
    }
  })
})
