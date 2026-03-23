import { PubSub } from 'graphql-subscriptions'
import type { Run, NodeExecution } from '@prisma/client'

// Single shared PubSub instance — replace with Redis-backed PubSub in production
// for multi-instance deployments
export const pubsub = new PubSub()

// Pub/Sub event keys
export const EVENTS = {
  RUN_UPDATED: (runId: string): string => `RUN_UPDATED_${runId}`,
  NODE_EXECUTION_UPDATED: (runId: string): string => `NODE_EXECUTION_UPDATED_${runId}`,
  NODE_LOG: (runId: string, nodeId: string): string => `NODE_LOG_${runId}_${nodeId}`,
} as const

export const subscriptionResolvers = {
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
        return pubsub.asyncIterator<string>([EVENTS.NODE_LOG(runId, nodeId)])
      },
      resolve: (payload: { nodeLogStream: string }): string => payload.nodeLogStream,
    },
  },
}
