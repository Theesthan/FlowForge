/**
 * HumanGateNode executor — pauses workflow execution and waits for human review.
 * The executor emits a PAUSED signal; the FSM engine will persist state and halt.
 * Execution resumes when the frontend calls resumeRun with an approved output.
 */
import type { NodeExecutor, ExecutorResult } from './index'

export const humanGateExecutor: NodeExecutor = {
  async execute(config, input): Promise<ExecutorResult> {
    // Signal the FSM to pause at this node
    return {
      output: {
        prompt: config.promptMessage ?? 'Human review required',
        inputData: input,
        awaitingApproval: true,
      },
      pause: true,
    }
  },
}
