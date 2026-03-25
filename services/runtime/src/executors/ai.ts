/**
 * AINode executor — calls Groq (llama-3.3-70b-versatile).
 * Streams tokens to Redis pub/sub for real-time execution console display.
 */
import Groq from 'groq-sdk'
import type { NodeExecutor, ExecutorResult, ExecutorContext } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

function buildUserContent(
  inputMapping: Record<string, string> | undefined,
  input: Record<string, unknown>,
): string {
  if (!inputMapping) return JSON.stringify(input, null, 2)

  const mapped: Record<string, unknown> = {}
  for (const [key, path] of Object.entries(inputMapping)) {
    // Simple dot-path resolution: "nodeId.field" → input[nodeId][field]
    const parts = path.split('.')
    let val: unknown = input
    for (const p of parts) {
      val = (val as Record<string, unknown>)?.[p]
    }
    mapped[key] = val
  }
  return JSON.stringify(mapped, null, 2)
}

export const aiExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
    context: ExecutorContext,
  ): Promise<ExecutorResult> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY env var is not set')

    const groq = new Groq({ apiKey })
    const userContent = buildUserContent(config.inputMapping, input)

    const stream = await groq.chat.completions.create({
      model: config.model ?? DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt ?? 'You are a helpful AI assistant.',
        },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    })

    let fullText = ''
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? ''
      if (token) {
        fullText += token
        await context.emitLog(token)
      }
    }

    // Attempt JSON parse if output schema is defined; fall back to text
    let output: Record<string, unknown> = { text: fullText }
    if (config.outputSchema && fullText.trim().startsWith('{')) {
      try {
        output = JSON.parse(fullText) as Record<string, unknown>
      } catch {
        output = { text: fullText }
      }
    }

    return { output }
  },
}
