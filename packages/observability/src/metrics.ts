/**
 * Shared Prometheus metrics registry for all FlowForge services.
 * Each service imports this module and exposes GET /metrics.
 */
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from 'prom-client'

export const registry = new Registry()

// Collect default Node.js metrics (heap, GC, event loop lag, etc.)
collectDefaultMetrics({ register: registry })

// ── HTTP ─────────────────────────────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: 'flowforge_http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['service', 'method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
})

export const httpRequestsTotal = new Counter({
  name: 'flowforge_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'route', 'status'],
  registers: [registry],
})

// ── Workflow runs ─────────────────────────────────────────────────────────────

export const workflowRunsTotal = new Counter({
  name: 'flowforge_workflow_runs_total',
  help: 'Total workflow runs started',
  labelNames: ['triggered_by'],
  registers: [registry],
})

export const workflowRunOutcomes = new Counter({
  name: 'flowforge_workflow_run_outcomes_total',
  help: 'Workflow run terminal outcomes',
  labelNames: ['status'],
  registers: [registry],
})

export const activeRunsGauge = new Gauge({
  name: 'flowforge_active_runs',
  help: 'Number of currently RUNNING workflow runs',
  registers: [registry],
})

// ── Node executions ───────────────────────────────────────────────────────────

export const nodeExecutionsTotal = new Counter({
  name: 'flowforge_node_executions_total',
  help: 'Total node executions by type and status',
  labelNames: ['node_type', 'status'],
  registers: [registry],
})

export const nodeExecutionDuration = new Histogram({
  name: 'flowforge_node_execution_duration_seconds',
  help: 'Node execution duration in seconds',
  labelNames: ['node_type'],
  buckets: [0.1, 0.5, 1, 5, 15, 30, 60, 120],
  registers: [registry],
})

// ── Express instrumentation middleware ───────────────────────────────────────

import type { Request, Response, NextFunction } from 'express'

export function metricsMiddleware(service: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint()

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e9
      const route = req.route?.path ?? req.path
      const labels = {
        service,
        method: req.method,
        route,
        status: String(res.statusCode),
      }
      httpRequestDuration.observe(labels, durationMs)
      httpRequestsTotal.inc(labels)
    })

    next()
  }
}
