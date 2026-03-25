/**
 * OutputNode executor — terminal node that records final workflow output.
 * Integration delivery (Slack, Notion, email, webhook) is TODO per target.
 */
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

async function sendWebhook(url: string, payload: unknown): Promise<void> {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export const outputExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
    context,
  ): Promise<ExecutorResult> {
    const targets = config.outputTargets ?? ['complete']
    const results: Record<string, unknown> = {}

    for (const target of targets) {
      if (target === 'webhook' && config.url) {
        await sendWebhook(config.url, input)
        results.webhook = { sent: true, url: config.url }
      } else {
        // Targets like email/notion/slack are logged — integrations are a future phase
        await context.emitLog(`[Output → ${target}] ${JSON.stringify(input).slice(0, 200)}\n`)
        results[target] = { queued: true }
      }
    }

    return {
      output: {
        targets,
        results,
        data: input,
        completedAt: new Date().toISOString(),
      },
    }
  },
}
