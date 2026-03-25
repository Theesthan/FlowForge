/**
 * LoopNode executor — iterates over a list from input.
 * The FSM engine will need to handle loop semantics separately;
 * this executor validates config and sets up the iteration context.
 */
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

export const loopExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
  ): Promise<ExecutorResult> {
    const iterateOver = config.iterateOver ?? ''
    const maxIterations = config.maxIterations ?? 100

    // Resolve the list to iterate over (dot-path from input)
    const parts = iterateOver.split('.')
    let items: unknown = input
    for (const p of parts) {
      items = (items as Record<string, unknown>)?.[p]
    }

    if (!Array.isArray(items)) {
      throw new Error(`LoopNode: "${iterateOver}" did not resolve to an array`)
    }

    const bounded = items.slice(0, maxIterations)

    return {
      output: {
        items: bounded,
        totalItems: items.length,
        iterationsPlanned: bounded.length,
        currentIndex: 0,
      },
    }
  },
}
