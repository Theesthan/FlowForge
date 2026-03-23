/**
 * Runtime Service (FSM Engine) — port 4002
 *
 * Responsibilities (to be implemented):
 *   - Custom FSM executor: PENDING → RUNNING → SUCCESS | FAILED | FALLBACK
 *   - Fan-out (parallel branches) and fan-in (join/merge) support
 *   - Retry with exponential backoff (max 3 attempts)
 *   - Fallback output on repeated failure
 *   - Pause/resume: persists exact node pointer + state in Redis + Postgres
 *   - Emits real-time events via Redis pub/sub → GraphQL subscriptions
 */
import express from 'express'
import pino from 'pino'
import Redis from 'ioredis'
import { REDIS_CHANNELS } from '@flowforge/types'

const logger = pino({
  level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  transport:
    process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

const PORT = parseInt(process.env['PORT'] ?? '4002', 10)
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379'

// Redis client for pub/sub event emission
const redis = new Redis(REDIS_URL, { lazyConnect: true })

redis.on('error', (err: Error) => {
  logger.error({ err }, 'Redis connection error')
})

const app = express()
app.use(express.json())

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'runtime', ts: new Date().toISOString() })
})

// ── Placeholder: execute run ──────────────────────────────────────────────────
app.post('/execute', async (req, res) => {
  const { runId } = req.body as { runId?: string }
  if (!runId) {
    res.status(400).json({ error: 'runId is required' })
    return
  }

  logger.info({ runId }, 'Execution requested — stub: emitting RUNNING event')

  // Stub: publish a run-updated event so the subscription pipeline is testable
  const channel = REDIS_CHANNELS.runUpdated(runId)
  await redis.publish(channel, JSON.stringify({ runId, status: 'RUNNING', updatedAt: new Date().toISOString() }))

  res.status(501).json({ error: 'Not implemented — FSM runtime coming soon' })
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
