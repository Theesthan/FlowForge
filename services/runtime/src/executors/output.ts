/**
 * OutputNode executor — terminal node that delivers workflow results.
 *
 * Supported targets:
 *   webhook  → HTTP POST to config.url
 *   slack    → Slack Incoming Webhook (SLACK_WEBHOOK_URL) or chat.postMessage (SLACK_BOT_TOKEN)
 *   notion   → Notion API: creates a page in a database (NOTION_API_KEY + notionDatabaseId)
 *   email    → SMTP via nodemailer (SMTP_* env vars)
 *   complete → logs the result; no external delivery
 */
import nodemailer from 'nodemailer'
import pino from 'pino'
import type { NodeExecutor, ExecutorResult } from './index'
import type { WorkflowNodeConfig } from '@flowforge/types'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, path: string) => {
    const parts = path.split('.')
    let value: unknown = data
    for (const part of parts) {
      value = (value as Record<string, unknown>)?.[part]
    }
    return value !== undefined && value !== null ? String(value) : ''
  })
}

function summarise(input: Record<string, unknown>): string {
  return JSON.stringify(input, null, 2).slice(0, 2000)
}

// ── Delivery functions ─────────────────────────────────────────────────────────

async function deliverWebhook(
  url: string,
  payload: unknown,
): Promise<{ sent: boolean; url: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Webhook delivery failed: ${res.status} ${res.statusText}`)
  return { sent: true, url }
}

async function deliverSlack(
  config: WorkflowNodeConfig,
  input: Record<string, unknown>,
): Promise<{ sent: boolean; channel?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  const botToken = process.env.SLACK_BOT_TOKEN
  const messageTemplate = config.slackMessage ?? '```{{json}}```'
  const text = renderTemplate(messageTemplate, { ...input, json: summarise(input) })

  if (webhookUrl) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)
    return { sent: true }
  }

  if (botToken && config.slackChannel) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${botToken}`,
      },
      body: JSON.stringify({ channel: config.slackChannel, text }),
    })
    const json = await res.json() as { ok: boolean; error?: string }
    if (!json.ok) throw new Error(`Slack postMessage failed: ${json.error}`)
    return { sent: true, channel: config.slackChannel }
  }

  logger.warn('Slack output: no SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN+slackChannel configured')
  return { sent: false }
}

async function deliverNotion(
  config: WorkflowNodeConfig,
  input: Record<string, unknown>,
): Promise<{ created: boolean; pageId?: string }> {
  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) {
    logger.warn('Notion output: NOTION_API_KEY not configured')
    return { created: false }
  }

  const databaseId = config.notionDatabaseId ?? process.env.NOTION_DATABASE_ID
  if (!databaseId) {
    logger.warn('Notion output: notionDatabaseId not set on node config or NOTION_DATABASE_ID env var')
    return { created: false }
  }

  const titleTemplate = config.notionTitle ?? 'FlowForge Output — {{triggerTime}}'
  const title = renderTemplate(titleTemplate, input)

  const body = {
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: title } }] },
    },
    children: [
      {
        object: 'block',
        type: 'code',
        code: {
          rich_text: [{ type: 'text', text: { content: summarise(input) } }],
          language: 'json',
        },
      },
    ],
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Notion API error: ${res.status} — ${err}`)
  }

  const page = await res.json() as { id?: string }
  return { created: true, pageId: page.id }
}

async function deliverEmail(
  config: WorkflowNodeConfig,
  input: Record<string, unknown>,
): Promise<{ sent: boolean; to?: string }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    logger.warn('Email output: SMTP_* env vars not fully configured')
    return { sent: false }
  }

  const to = config.emailTo
  if (!to) {
    logger.warn('Email output: emailTo not set on node config')
    return { sent: false }
  }

  const subjectTemplate = config.emailSubject ?? 'FlowForge Workflow Output'
  const subject = renderTemplate(subjectTemplate, input)

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text: summarise(input),
    html: `<pre style="font-family:monospace;font-size:13px">${summarise(input)}</pre>`,
  })

  return { sent: true, to }
}

// ── Executor ──────────────────────────────────────────────────────────────────

export const outputExecutor: NodeExecutor = {
  async execute(
    config: WorkflowNodeConfig,
    input: Record<string, unknown>,
    context,
  ): Promise<ExecutorResult> {
    const targets = config.outputTargets ?? ['complete']
    const results: Record<string, unknown> = {}

    for (const target of targets) {
      try {
        switch (target) {
          case 'webhook': {
            if (!config.url) {
              await context.emitLog('[Output → webhook] No URL configured — skipped\n')
              results.webhook = { skipped: true, reason: 'no url' }
              break
            }
            const r = await deliverWebhook(config.url, input)
            results.webhook = r
            await context.emitLog(`[Output → webhook] Delivered to ${config.url}\n`)
            break
          }

          case 'slack': {
            const r = await deliverSlack(config, input)
            results.slack = r
            await context.emitLog(`[Output → slack] ${r.sent ? 'Sent' : 'Skipped (no credentials)'}\n`)
            break
          }

          case 'notion': {
            const r = await deliverNotion(config, input)
            results.notion = r
            await context.emitLog(`[Output → notion] ${r.created ? `Page created: ${r.pageId}` : 'Skipped'}\n`)
            break
          }

          case 'email': {
            const r = await deliverEmail(config, input)
            results.email = r
            await context.emitLog(`[Output → email] ${r.sent ? `Sent to ${r.to}` : 'Skipped (no config)'}\n`)
            break
          }

          case 'complete':
          default: {
            await context.emitLog(`[Output → complete] ${JSON.stringify(input).slice(0, 200)}\n`)
            results[target] = { logged: true }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.error({ err, target }, 'Output delivery failed')
        await context.emitLog(`[Output → ${target}] ERROR: ${msg}\n`)
        results[target] = { error: msg }
        // Don't rethrow — let the workflow continue; individual target failure is non-fatal
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
