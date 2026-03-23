/**
 * Orchestrator Service — port 4001
 *
 * Responsibilities (to be implemented):
 *   - Workflow CRUD (proxied from API gateway)
 *   - DAG validation (cycle detection, required field checks)
 *   - Run creation: converts workflow definition → execution graph
 *   - Dispatches execution graphs to the Runtime service
 */
import express from 'express'
import pino from 'pino'
import { env } from '@flowforge/config'

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

const PORT = 4001 // Orchestrator always on 4001

const app = express()
app.use(express.json())

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orchestrator', ts: new Date().toISOString() })
})

// ── Placeholder: DAG validation endpoint ─────────────────────────────────────
app.post('/validate', (req, res) => {
  // TODO: Implement cycle detection (Kahn's algorithm or DFS)
  // TODO: Validate required fields per node type
  logger.info('DAG validation requested — stub response')
  res.json({ valid: true, errors: [] })
})

// ── Placeholder: trigger run endpoint ────────────────────────────────────────
app.post('/runs', (req, res) => {
  // TODO: Convert workflow definition → execution graph
  // TODO: Persist Run + NodeExecution records
  // TODO: Dispatch to Runtime service
  logger.info({ body: req.body }, 'Run trigger requested — stub response')
  res.status(501).json({ error: 'Not implemented — FSM runtime coming soon' })
})

app.listen(PORT, () => {
  logger.info(`⚙️  Orchestrator → http://localhost:${PORT}`)
})
