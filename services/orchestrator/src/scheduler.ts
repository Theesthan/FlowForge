/**
 * Trigger Scheduler
 *
 * Polls the workflow DB on startup and every RESCAN_INTERVAL_MS to discover
 * active workflows whose TriggerNode type is CRON or RSS.
 *
 * - CRON workflows → scheduled via node-cron using the node's cronExpression.
 * - RSS workflows  → polled every rssCheckIntervalMins (default 5) via rss-parser;
 *   each new item that has not been seen before triggers a run.
 *
 * State:
 *   - cron tasks are stored in a Map keyed by workflowId so they can be
 *     stopped and replaced when a workflow is updated.
 *   - RSS last-seen item guids are stored in an in-process Set (good enough
 *     for a single-instance deployment; replace with Redis for multi-instance).
 */
import cron from 'node-cron'
import Parser from 'rss-parser'
import pino from 'pino'
import { prisma } from '@flowforge/db'
import type { WorkflowDefinition } from '@flowforge/types'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })
const rssParser = new Parser()

const RESCAN_INTERVAL_MS = 5 * 60 * 1000  // re-scan for new/updated workflows every 5 min

// workflowId → cron task
const cronTasks = new Map<string, cron.ScheduledTask>()
// workflowId → Set of seen RSS item guids
const rssSeenGuids = new Map<string, Set<string>>()
// workflowId → setTimeout handle for RSS polling
const rssTimers = new Map<string, NodeJS.Timeout>()

type RunFactory = (workflowId: string, input: Record<string, unknown>) => Promise<void>

/** Start the scheduler. Provide a `createRun` callback that dispatches to Runtime. */
export function startScheduler(createRun: RunFactory): void {
  void scanAndSchedule(createRun)
  setInterval(() => void scanAndSchedule(createRun), RESCAN_INTERVAL_MS)
  logger.info('Trigger scheduler started')
}

async function scanAndSchedule(createRun: RunFactory): Promise<void> {
  try {
    const workflows = await prisma.workflow.findMany({ where: { deletedAt: null } })

    const activeIds = new Set<string>()

    for (const wf of workflows) {
      const def = wf.definition as unknown as WorkflowDefinition
      if (!def?.nodes) continue

      const triggerNode = def.nodes.find((n) => n.type === 'TriggerNode')
      if (!triggerNode) continue

      const { triggerType, cronExpression, rssUrl, rssCheckIntervalMins } = triggerNode.config

      if (triggerType === 'CRON' && cronExpression) {
        activeIds.add(wf.id)
        scheduleCron(wf.id, wf.name, cronExpression, createRun)
      }

      if (triggerType === 'RSS' && rssUrl) {
        activeIds.add(wf.id)
        scheduleRss(wf.id, wf.name, rssUrl, rssCheckIntervalMins ?? 5, createRun)
      }
    }

    // Stop tasks for workflows that no longer exist / have changed trigger type
    for (const [workflowId, task] of cronTasks) {
      if (!activeIds.has(workflowId)) {
        task.stop()
        cronTasks.delete(workflowId)
        logger.info({ workflowId }, 'Stopped cron task for removed/changed workflow')
      }
    }
    for (const [workflowId, timer] of rssTimers) {
      if (!activeIds.has(workflowId)) {
        clearTimeout(timer)
        rssTimers.delete(workflowId)
        rssSeenGuids.delete(workflowId)
        logger.info({ workflowId }, 'Stopped RSS polling for removed/changed workflow')
      }
    }
  } catch (err: unknown) {
    logger.error({ err }, 'Scheduler scan error')
  }
}

function scheduleCron(
  workflowId: string,
  workflowName: string,
  expression: string,
  createRun: RunFactory,
): void {
  // Don't re-schedule if already running with the same expression
  if (cronTasks.has(workflowId)) return

  if (!cron.validate(expression)) {
    logger.warn({ workflowId, expression }, 'Invalid cron expression — skipping')
    return
  }

  const task = cron.schedule(expression, () => {
    logger.info({ workflowId, workflowName, expression }, 'Cron trigger fired')
    void createRun(workflowId, { triggerType: 'CRON', firedAt: new Date().toISOString() })
  })

  cronTasks.set(workflowId, task)
  logger.info({ workflowId, workflowName, expression }, 'Cron task scheduled')
}

function scheduleRss(
  workflowId: string,
  workflowName: string,
  feedUrl: string,
  intervalMins: number,
  createRun: RunFactory,
): void {
  // Already scheduled
  if (rssTimers.has(workflowId)) return

  // Initialise seen-guids set (empty on first boot → first poll seeds it without triggering)
  rssSeenGuids.set(workflowId, new Set())

  const intervalMs = Math.max(1, intervalMins) * 60 * 1000

  const poll = async (): Promise<void> => {
    try {
      const feed = await rssParser.parseURL(feedUrl)
      const seenGuids = rssSeenGuids.get(workflowId)!
      let isFirstPoll = seenGuids.size === 0

      for (const item of feed.items ?? []) {
        const guid = item.guid ?? item.link ?? item.title ?? String(Date.now())
        if (isFirstPoll) {
          // Seed without triggering runs on first poll
          seenGuids.add(guid)
          continue
        }
        if (seenGuids.has(guid)) continue

        seenGuids.add(guid)
        logger.info({ workflowId, workflowName, guid }, 'RSS new item — triggering run')
        void createRun(workflowId, {
          triggerType: 'RSS',
          feedUrl,
          item: {
            title: item.title,
            link: item.link,
            content: item.contentSnippet ?? item.content,
            pubDate: item.pubDate,
            guid,
          },
        })
      }

      if (isFirstPoll) {
        logger.info({ workflowId, workflowName, itemCount: seenGuids.size }, 'RSS feed seeded (no runs on first poll)')
      }
    } catch (err: unknown) {
      logger.warn({ err, workflowId, feedUrl }, 'RSS poll error')
    }

    // Schedule next poll
    const timer = setTimeout(() => void poll(), intervalMs)
    rssTimers.set(workflowId, timer)
  }

  // Start first poll after one interval (not immediately, to allow DB to be ready)
  const timer = setTimeout(() => void poll(), intervalMs)
  rssTimers.set(workflowId, timer)
  logger.info({ workflowId, workflowName, feedUrl, intervalMins }, 'RSS polling scheduled')
}
