/**
 * Redis → GraphQL PubSub bridge
 *
 * The FSM Runtime publishes node/run state changes to Redis pub/sub.
 * This bridge subscribes to those channels with psubscribe and republishes
 * each event into the in-memory GraphQL PubSub so WebSocket subscribers
 * receive real-time updates.
 *
 * Channel patterns (from @flowforge/types REDIS_CHANNELS):
 *   run:{runId}:updated              → RunUpdatedEvent
 *   run:{runId}:node:updated         → NodeExecutionUpdatedEvent
 *   run:{runId}:node:{nodeId}:log    → NodeLogEvent
 */
import Redis from 'ioredis'
import { prisma } from '@flowforge/db'
import type { PubSub } from 'graphql-subscriptions'
import { logger } from '../logger'
import { EVENTS } from '../graphql/resolvers/subscription'

interface RunUpdatedPayload {
  runId: string
  status: string
  updatedAt: string
}

interface NodeExecUpdatedPayload {
  runId: string
  nodeId: string
  nodeExecutionId: string
  status: string
  retries: number
  output?: Record<string, unknown>
  updatedAt: string
}

interface NodeLogPayload {
  runId: string
  nodeId: string
  message: string
  level: string
  timestamp: string
}

export function startRedisPubSubBridge(redisUrl: string, pubsub: PubSub): void {
  const subscriber = new Redis(redisUrl, { lazyConnect: true })

  subscriber.on('error', (err: Error) => {
    logger.error({ err }, 'Redis PubSub bridge subscriber error')
  })

  // Use pmessage for pattern-based subscriptions
  subscriber.on('pmessage', async (pattern: string, channel: string, message: string) => {
    try {
      await routeMessage(channel, message, pubsub)
    } catch (err: unknown) {
      logger.error({ err, channel }, 'Error routing Redis pub/sub message')
    }
  })

  subscriber
    .connect()
    .then(() => {
      // Subscribe to all run-related channels
      return subscriber.psubscribe('run:*')
    })
    .then(() => {
      logger.info('Redis PubSub bridge active — subscribed to run:*')
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'Failed to connect Redis PubSub bridge')
    })
}

/**
 * Route a Redis channel message to the correct GraphQL PubSub event.
 *
 * Channel patterns:
 *   run:{runId}:updated          → fetch Run from DB, publish workflowRunUpdated
 *   run:{runId}:node:updated     → fetch NodeExecution from DB, publish nodeExecutionUpdated
 *   run:{runId}:node:{nodeId}:log→ publish nodeLogStream token
 */
async function routeMessage(channel: string, message: string, pubsub: PubSub): Promise<void> {
  // run:{runId}:updated
  const runUpdatedMatch = channel.match(/^run:([^:]+):updated$/)
  if (runUpdatedMatch) {
    const runId = runUpdatedMatch[1]
    const payload = JSON.parse(message) as RunUpdatedPayload
    logger.debug({ runId, status: payload.status }, 'Bridge: run updated')

    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { nodeExecutions: { orderBy: { createdAt: 'asc' } } },
    })
    if (run) {
      await pubsub.publish(EVENTS.RUN_UPDATED(runId), { workflowRunUpdated: run })
    }
    return
  }

  // run:{runId}:node:updated
  const nodeUpdatedMatch = channel.match(/^run:([^:]+):node:updated$/)
  if (nodeUpdatedMatch) {
    const runId = nodeUpdatedMatch[1]
    const payload = JSON.parse(message) as NodeExecUpdatedPayload
    logger.debug({ runId, nodeId: payload.nodeId, status: payload.status }, 'Bridge: node updated')

    const nodeExec = await prisma.nodeExecution.findUnique({
      where: { id: payload.nodeExecutionId },
    })
    if (nodeExec) {
      await pubsub.publish(EVENTS.NODE_EXECUTION_UPDATED(runId), {
        nodeExecutionUpdated: nodeExec,
      })
    }
    return
  }

  // run:{runId}:node:{nodeId}:log
  const nodeLogMatch = channel.match(/^run:([^:]+):node:([^:]+):log$/)
  if (nodeLogMatch) {
    const runId = nodeLogMatch[1]
    const nodeId = nodeLogMatch[2]
    const payload = JSON.parse(message) as NodeLogPayload
    logger.debug({ runId, nodeId }, 'Bridge: node log token')

    await pubsub.publish(EVENTS.NODE_LOG(runId, nodeId), {
      nodeLogStream: payload.message,
    })
    return
  }
}
