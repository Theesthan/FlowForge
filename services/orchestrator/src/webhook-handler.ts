/**
 * Webhook Trigger Handler
 *
 * Adds a route: POST /webhook/:webhookPath
 *
 * When a request arrives, this handler:
 *   1. Scans all active workflows for a TriggerNode with triggerType=WEBHOOK
 *      and webhookPath matching the URL param.
 *   2. Creates a run for each matching workflow, passing the request body
 *      and headers as the trigger input.
 *
 * Security: For v1, no secret verification. Add HMAC/token checks here before
 * production use.
 */
import type { Express, Request, Response } from 'express'
import pino from 'pino'
import { prisma } from '@flowforge/db'
import type { WorkflowDefinition } from '@flowforge/types'

const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' })

type RunFactory = (workflowId: string, input: Record<string, unknown>) => Promise<void>

export function registerWebhookRoutes(app: Express, createRun: RunFactory): void {
  app.post('/webhook/:webhookPath', (req: Request, res: Response) => {
    void handleWebhook(req, res, createRun)
  })

  logger.info('Webhook trigger routes registered at POST /webhook/:webhookPath')
}

async function handleWebhook(
  req: Request,
  res: Response,
  createRun: RunFactory,
): Promise<void> {
  const { webhookPath } = req.params as { webhookPath: string }

  try {
    const workflows = await prisma.workflow.findMany({ where: { deletedAt: null } })

    const matches: string[] = []

    for (const wf of workflows) {
      const def = wf.definition as unknown as WorkflowDefinition
      if (!def?.nodes) continue

      const trigger = def.nodes.find((n) => n.type === 'TriggerNode')
      if (
        trigger?.config.triggerType === 'WEBHOOK' &&
        trigger.config.webhookPath === webhookPath
      ) {
        matches.push(wf.id)
      }
    }

    if (matches.length === 0) {
      res.status(404).json({ error: `No workflow registered for webhook path: ${webhookPath}` })
      return
    }

    // Respond immediately — dispatch runs in background
    res.status(202).json({ accepted: true, triggeredWorkflows: matches.length })

    const input: Record<string, unknown> = {
      triggerType: 'WEBHOOK',
      webhookPath,
      receivedAt: new Date().toISOString(),
      body: req.body as unknown,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
      },
    }

    for (const workflowId of matches) {
      logger.info({ workflowId, webhookPath }, 'Webhook trigger fired')
      void createRun(workflowId, input)
    }
  } catch (err: unknown) {
    logger.error({ err, webhookPath }, 'Webhook handler error')
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
