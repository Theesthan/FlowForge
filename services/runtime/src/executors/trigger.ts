import type { NodeExecutor, ExecutorResult } from './index'

/** TriggerNode — entry point of every workflow run. Passes through input unchanged. */
export const triggerExecutor: NodeExecutor = {
  async execute(_config, input): Promise<ExecutorResult> {
    return {
      output: {
        triggerTime: new Date().toISOString(),
        ...input,
      },
    }
  },
}
