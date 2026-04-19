/**
 * ToolNode executor — generic HTTP call with simple template rendering.
 * Supports GET/POST/PUT/PATCH/DELETE.
 */
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

/** Replace {{key}} placeholders in a template string using input data */
function renderTemplate(template: string, input: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
    const parts = path.split('.')
    let val: unknown = input
    for (const p of parts) {
      val = (val as Record<string, unknown>)?.[p]
    }
    return val != null ? String(val) : ''
  })
}

export const toolExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
  ): Promise<ExecutorResult> {
    if (!config.url) {
      const toolType = (config as Record<string, unknown>)['toolType'] as string | undefined
      return { output: { skipped: true, reason: 'ToolNode: no url configured', toolType: toolType ?? 'unknown' } }
    }

    const method = config.method ?? 'GET'
    const url = renderTemplate(config.url, input)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    }

    let body: string | undefined
    if (config.bodyTemplate && method !== 'GET') {
      body = renderTemplate(config.bodyTemplate, input)
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    let data: unknown
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`)
    }

    return {
      output: {
        status: response.status,
        data,
        url,
        method,
      },
    }
  },
}
