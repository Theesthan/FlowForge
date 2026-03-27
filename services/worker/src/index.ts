/**
 * Worker Service — BullMQ queue consumer
 *
 * Responsibilities (to be implemented):
 *   - Consume jobs from the 'node-execution' queue
 *   - Execute individual FSM nodes asynchronously
 *   - Report results back to the Runtime via Redis pub/sub
 *   - Enables horizontal scaling of node execution
 *
 * Node executors (to be built per node type):
 *   - TriggerNode: cron, webhook, gmail_poll, rss, manual
 *   - AINode: Groq llama-3.3-70b-versatile
 *   - ToolNode: HTTP, Gmail, Notion, Slack, GitHub
 *   - ConditionNode: expression evaluator
 *   - LoopNode: list iterator
 *   - HumanGateNode: pause + notify
 *   - SubWorkflowNode: subroutine invocation
 *   - OutputNode: email / Notion / Slack / webhook
 */
import { Worker, Queue } from 'bullmq'
import pino from 'pino'
import { QUEUE_NAMES, type NodeExecutionJobData } from '@flowforge/types'
import { env } from '@flowforge/config'

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

// Pass URL string directly — BullMQ creates its own ioredis instance internally,
// avoiding version-mismatch type errors when using a shared Redis instance.
const connection = { url: env.REDIS_URL }

// ── Queue instance (used to add jobs from Runtime) ────────────────────────────
export const nodeExecutionQueue = new Queue(QUEUE_NAMES.NODE_EXECUTION, { connection })

// ── Worker: consumes node-execution jobs ─────────────────────────────────────
const worker = new Worker<NodeExecutionJobData>(
  QUEUE_NAMES.NODE_EXECUTION,
  async (job) => {
    const { runId, nodeId, nodeType, config, input, attempt } = job.data

    logger.info({ runId, nodeId, nodeType, attempt }, 'Processing node execution job')

    // TODO: Route to node-type-specific executor
    // switch (nodeType) {
    //   case 'AINode': return executeAINode(config, input)
    //   case 'ToolNode': return executeToolNode(config, input)
    //   ...
    // }

    logger.warn({ nodeType }, 'No executor registered for node type — stub passthrough')
    return { status: 'FALLBACK', output: {}, message: 'Executor not implemented' }
  },
  {
    connection,
    concurrency: 5,
  }
)

worker.on('completed', (job) => {
  logger.info({ jobId: job.id, runId: job.data.runId }, 'Job completed')
})

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed')
})

worker.on('error', (err) => {
  logger.error({ err }, 'Worker error')
})

logger.info(`🔧 Worker started — consuming queue: ${QUEUE_NAMES.NODE_EXECUTION}`)

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — draining worker')
  await worker.close()
  process.exit(0)
})
