/**
 * ConditionNode executor — evaluates a JS expression against node input.
 * Returns conditionResult: 'true' | 'false' to route downstream edges.
 *
 * Expression examples:
 *   "score > 0.8"
 *   "status === 'success'"
 *   "items.length > 0"
 */
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

export const conditionExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
  ): Promise<ExecutorResult> {
    const expression = config.expression ?? 'false'
    let result = false

    try {
      // Evaluate the expression with input fields as local variables
      const keys = Object.keys(input)
      const values = Object.values(input)
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `"use strict"; return Boolean(${expression})`)
      result = fn(...values) as boolean
    } catch (err) {
      // Expression error → treat as false, don't fail the node
      result = false
    }

    return {
      output: {
        result,
        expression,
      },
      conditionResult: result ? 'true' : 'false',
    }
  },
}
