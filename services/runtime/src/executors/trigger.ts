/**
 * TriggerNode executor — entry point of every workflow run.
 *
 * For MANUAL triggers: passes through any input unchanged + adds triggerTime.
 * For CRON / WEBHOOK / RSS triggers: merges the triggerInput stored in Redis
 * (set by the Orchestrator when creating the run) into the output so downstream
 * nodes can access webhook payloads, RSS items, etc.
 *
 * For GMAIL_POLL triggers: stub — returns placeholder (full Gmail OAuth2 flow
 * is deferred to a future phase).
 */
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'
import Redis from 'ioredis'

let _redis: Redis | null = null
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(REDIS_URL, { lazyConnect: false })
    _redis.on('error', () => {}) // suppress unhandled errors
  }
  return _redis
}

async function readTriggerInput(runId: string): Promise<Record<string, unknown>> {
  try {
    const raw = await getRedis().get(`run:${runId}:triggerInput`)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

export const triggerExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
    context,
  ): Promise<ExecutorResult> {
    // Normalize to uppercase — UI config panels store lowercase ('manual', 'cron', etc.)
    // but the canonical TriggerType enum is uppercase
    const triggerType = (config.triggerType ?? 'MANUAL').toUpperCase()
    const base = { triggerType, triggerTime: new Date().toISOString() }

    if (triggerType === 'MANUAL') {
      return { output: { ...base, ...input } }
    }

    // For scheduler-fired triggers: read stored payload from Redis
    const stored = await readTriggerInput(context.runId)

    switch (triggerType) {
      case 'CRON':
        return {
          output: {
            ...base,
            firedAt: (stored.firedAt as string) ?? base.triggerTime,
          },
        }

      case 'WEBHOOK':
        return {
          output: {
            ...base,
            webhookPath: stored.webhookPath,
            body: stored.body ?? {},
            headers: stored.headers ?? {},
            receivedAt: stored.receivedAt ?? base.triggerTime,
          },
        }

      case 'RSS': {
        const feedUrl = stored.feedUrl ?? config.rssUrl ?? (config as Record<string, unknown>)['url'] as string | undefined
        // When run manually (no scheduler item stored), provide a demo RSS item so
        // downstream ToolNodes with {{item.link}} can actually fetch something useful.
        const item = (stored.item && Object.keys(stored.item).length > 0)
          ? stored.item
          : {
              title: 'Attention Is All You Need (demo — run manually)',
              link: 'https://arxiv.org/abs/1706.03762',
              description: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
              pubDate: new Date().toISOString(),
              id: '1706.03762',
            }
        return {
          output: {
            ...base,
            feedUrl,
            item,
            isManualRun: !stored.item,
          },
        }
      }

      case 'GMAIL_POLL':
        // Full OAuth2 flow deferred; return stub so workflow can proceed in tests
        return {
          output: {
            ...base,
            stub: true,
            message: 'Gmail poll trigger is not yet implemented. Configure OAuth2 credentials.',
          },
        }

      default:
        return { output: { ...base, ...input } }
    }
  },
}
