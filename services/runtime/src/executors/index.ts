/**
 * Node Executor Registry
 * Maps each NodeType to its executor implementation.
 */
import type { NodeType, WorkflowNodeConfig } from '@flowforge/types'
import { triggerExecutor } from './trigger'
import { aiExecutor } from './ai'
import { toolExecutor } from './tool'
import { conditionExecutor } from './condition'
import { loopExecutor } from './loop'
import { humanGateExecutor } from './human-gate'
import { outputExecutor } from './output'

export interface ExecutorResult {
  output: Record<string, unknown>
  /** Set by ConditionNode: 'true' | 'false' — used to filter outgoing edges */
  conditionResult?: string
  /** True if this node is pausing execution (HumanGate) */
  pause?: boolean
}

export interface NodeExecutor {
  execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
    context: ExecutorContext,
  ): Promise<ExecutorResult>
}

export interface ExecutorContext {
  runId: string
  nodeId: string
  /** Emit a log token to Redis (used by AI streaming) */
  emitLog: (token: string) => Promise<void>
}

const registry: Partial<Record<NodeType, NodeExecutor>> = {
  TriggerNode: triggerExecutor,
  AINode: aiExecutor,
  ToolNode: toolExecutor,
  ConditionNode: conditionExecutor,
  LoopNode: loopExecutor,
  HumanGateNode: humanGateExecutor,
  OutputNode: outputExecutor,
}

export function getExecutor(type: NodeType): NodeExecutor {
  const executor = registry[type]
  if (!executor) throw new Error(`No executor registered for node type: ${type}`)
  return executor
}
