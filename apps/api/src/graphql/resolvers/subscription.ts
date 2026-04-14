import { PubSub } from 'graphql-subscriptions'
import type { Prisma } from '@flowforge/db'
type Run = Prisma.RunGetPayload<{ include: { nodeExecutions: true } }>
type NodeExecution = Prisma.NodeExecutionGetPayload<Record<string, never>>

// Single shared PubSub instance — replace with Redis-backed PubSub in production
// for multi-instance deployments
export const pubsub = new PubSub()

// Pub/Sub event keys
export const EVENTS = {
  RUN_UPDATED: (runId: string): string => `RUN_UPDATED_${runId}`,
  NODE_EXECUTION_UPDATED: (runId: string): string => `NODE_EXECUTION_UPDATED_${runId}`,
  NODE_LOG: (runId: string, nodeId: string): string => `NODE_LOG_${runId}_${nodeId}`,
} as const

// Explicit type breaks Prisma type inference chain (TS2742)
export const subscriptionResolvers: Record<string, unknown> = {
  Subscription: {
    workflowRunUpdated: {
      subscribe: (_: unknown, { runId }: { runId: string }) => {
        return pubsub.asyncIterator<Run>([EVENTS.RUN_UPDATED(runId)])
      },
      resolve: (payload: { workflowRunUpdated: Run }): Run => payload.workflowRunUpdated,
    },

    nodeExecutionUpdated: {
      subscribe: (_: unknown, { runId }: { runId: string }) => {
        return pubsub.asyncIterator<NodeExecution>([EVENTS.NODE_EXECUTION_UPDATED(runId)])
      },
      resolve: (payload: {
        nodeExecutionUpdated: NodeExecution
      }): NodeExecution => payload.nodeExecutionUpdated,
    },

    nodeLogStream: {
      subscribe: (_: unknown, { runId, nodeId }: { runId: string; nodeId: string }) => {
        return pubsub.asyncIterator<{ token: string; timestamp: string }>([EVENTS.NODE_LOG(runId, nodeId)])
      },
      resolve: (payload: { nodeLogStream: { token: string; timestamp: string } }) =>
        payload.nodeLogStream,
    },
  },
}
