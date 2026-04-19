/**
 * AINode executor — calls Groq (llama-3.3-70b-versatile).
 * Streams tokens to Redis pub/sub for real-time execution console display.
 *
 * Memory integration (when config.memoryEnabled = true):
 *   - Pre-call:  search org memory store for relevant context, inject into system prompt
 *   - Post-call: write AI response + input metadata to memory store
 */
import Groq from 'groq-sdk'
import type { NodeExecutor, ExecutorResult, ExecutorContext } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'
import { searchMemory, writeMemory, formatMemoriesForPrompt } from '../lib/memory'

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

    // ── Memory: search for relevant context ───────────────────────────────────
    let systemPrompt = config.systemPrompt ?? 'You are a helpful AI assistant.'
    if (config.memoryEnabled) {
      await context.emitLog('[Memory] Searching for relevant context…\n')
      const memories = await searchMemory(context.orgId, userContent)
      if (memories.length > 0) {
        systemPrompt += formatMemoriesForPrompt(memories)
        await context.emitLog(`[Memory] Injected ${memories.length} relevant memories into context.\n`)
      }
    }

    // ── LLM call ──────────────────────────────────────────────────────────────
    const stream = await groq.chat.completions.create({
      model: config.model ?? DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
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

    // Always attempt JSON parse when output looks like JSON.
    // Also handles LLM markdown-wrapped JSON: ```json { ... } ```
    let output: Record<string, unknown> = { text: fullText }
    const trimmed = fullText.trim()
    const mdJsonMatch = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i.exec(trimmed)
    const jsonCandidate = trimmed.startsWith('{') ? trimmed : (mdJsonMatch?.[1] ?? null)
    if (jsonCandidate) {
      try {
        output = JSON.parse(jsonCandidate) as Record<string, unknown>
      } catch {
        output = { text: fullText }
      }
    }

    // ── Memory: write response to memory store ────────────────────────────────
    if (config.memoryEnabled) {
      await writeMemory(context.orgId, fullText, {
        runId: context.runId,
        nodeId: context.nodeId,
        model: config.model ?? DEFAULT_MODEL,
        inputSummary: userContent.slice(0, 500),
      })
      await context.emitLog('[Memory] Response saved to memory store.\n')
    }

    return { output }
  },
}
