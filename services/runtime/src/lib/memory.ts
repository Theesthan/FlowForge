/**
 * Agent Memory — pgvector-backed long-term memory for AI nodes.
 *
 * Uses Groq's `nomic-embed-text-v1.5` model (768-dimensional embeddings).
 *
 * Two operations:
 *   writeMemory  — stores content + embedding in the `memories` table
 *   searchMemory — cosine similarity search, returns top-K relevant memories
 */
import Groq from 'groq-sdk'
import { prisma } from '@flowforge/db'
import pino from 'pino'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })

const EMBEDDING_MODEL = 'nomic-embed-text-v1.5'
const DEFAULT_TOP_K = 5
const MAX_CONTENT_LENGTH = 8_000 // chars — stay within embedding model context

export interface MemoryRecord {
  id: string
  content: string
  metadata: Record<string, unknown> | null
  similarity: number
}

// ── Embedding ─────────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY env var is not set')

  const groq = new Groq({ apiKey })
  const truncated = text.slice(0, MAX_CONTENT_LENGTH)

  const response = await groq.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
  })

  const embedding = response.data[0]?.embedding
  if (!embedding || typeof embedding === 'string') {
    throw new Error('Groq embeddings API returned unexpected format')
  }
  return embedding
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function writeMemory(
  orgId: string,
  content: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const embedding = await generateEmbedding(content)
    const vectorLiteral = `[${embedding.join(',')}]`

    // Prisma doesn't support vector columns directly — use raw SQL for the INSERT
    await prisma.$executeRaw`
      INSERT INTO memories (id, "orgId", content, embedding, metadata, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${orgId},
        ${content},
        ${vectorLiteral}::vector,
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        now(),
        now()
      )
    `
    logger.debug({ orgId, contentLength: content.length }, 'Memory written')
  } catch (err: unknown) {
    // Memory write is non-fatal — log and continue
    logger.warn({ err, orgId }, 'Failed to write memory — continuing without it')
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchMemory(
  orgId: string,
  query: string,
  topK: number = DEFAULT_TOP_K,
): Promise<MemoryRecord[]> {
  try {
    const embedding = await generateEmbedding(query)
    const vectorLiteral = `[${embedding.join(',')}]`

    // Cosine similarity: 1 - (embedding <=> query_vector)
    const rows = await prisma.$queryRaw<Array<{
      id: string
      content: string
      metadata: unknown
      similarity: number
    }>>`
      SELECT
        id,
        content,
        metadata,
        1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM memories
      WHERE "orgId" = ${orgId}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata as Record<string, unknown> | null,
      similarity: Number(r.similarity),
    }))
  } catch (err: unknown) {
    // Memory search is non-fatal — return empty list so the AI node still executes
    logger.warn({ err, orgId }, 'Failed to search memory — continuing without context')
    return []
  }
}

// ── Format for system prompt injection ───────────────────────────────────────

export function formatMemoriesForPrompt(memories: MemoryRecord[]): string {
  if (memories.length === 0) return ''

  const lines = memories.map((m, i) => `[Memory ${i + 1}] (similarity: ${m.similarity.toFixed(3)})\n${m.content}`)
  return `\n\n--- Relevant context from memory ---\n${lines.join('\n\n')}\n--- End of memory context ---`
}
