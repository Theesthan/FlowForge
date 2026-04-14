// ============================================================
// FlowForge — Shared TypeScript Types
// All runtime-safe, no external dependencies
// ============================================================

// --- Node Types ---
export type NodeType =
  | 'TriggerNode'
  | 'AINode'
  | 'ToolNode'
  | 'ConditionNode'
  | 'LoopNode'
  | 'HumanGateNode'
  | 'SubWorkflowNode'
  | 'OutputNode'

// --- FSM Lifecycle States ---
export type NodeExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'FALLBACK'

export type RunStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

// --- RBAC ---
export type Role = 'OWNER' | 'EDITOR' | 'VIEWER'

// --- Trigger Types ---
export type TriggerType = 'CRON' | 'WEBHOOK' | 'GMAIL_POLL' | 'RSS' | 'MANUAL'

// --- Workflow Definition (canonical JSON format) ---
export interface NodePosition {
  x: number
  y: number
}

export interface WorkflowNodeConfig {
  // Trigger-specific
  triggerType?: TriggerType
  cronExpression?: string
  webhookPath?: string

  // AI-specific
  model?: string
  systemPrompt?: string
  inputMapping?: Record<string, string>
  outputSchema?: Record<string, unknown>

  // Tool-specific
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  bodyTemplate?: string
  integration?: 'gmail' | 'notion' | 'slack' | 'github' | 'http'

  // Condition-specific
  expression?: string

  // Loop-specific
  iterateOver?: string
  maxIterations?: number
  breakCondition?: string

  // HumanGate-specific
  promptMessage?: string
  aiRecommendationPrompt?: string

  // SubWorkflow-specific
  subWorkflowId?: string
  inputMap?: Record<string, string>
  outputMap?: Record<string, string>

  // Output-specific
  outputTargets?: Array<'email' | 'notion' | 'slack' | 'webhook' | 'complete'>
  // Email output
  emailTo?: string          // comma-separated recipient addresses
  emailSubject?: string
  // Notion output
  notionDatabaseId?: string // overrides NOTION_DATABASE_ID env var
  notionTitle?: string      // page title template (may reference {{input.field}})
  // Slack output
  slackChannel?: string     // channel ID when using BOT_TOKEN (not needed for WEBHOOK_URL)
  slackMessage?: string     // message template

  // RSS trigger-specific
  rssUrl?: string
  rssCheckIntervalMins?: number  // polling interval, default 5

  // Memory (Phase 6)
  memoryEnabled?: boolean   // if true, AI node reads relevant memories + writes output to memory store

  // Shared
  hardFail?: boolean
  fallbackOutput?: Record<string, unknown>
  maxRetries?: number
}

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  config: WorkflowNodeConfig
  position: NodePosition
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
  // For ConditionNode: 'true' | 'false'
  condition?: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  metadata?: Record<string, unknown>
}

// --- Failure Policy ---
export interface FailurePolicy {
  maxRetries: number
  backoffMs: number
  hardFail: boolean
  fallbackOutput?: Record<string, unknown>
}

// --- GraphQL Context (passed through resolvers) ---
export interface GraphQLContext {
  token?: string
  userId?: string
  orgId?: string
  role?: Role
}

// --- FSM Execution Events (emitted via Redis pub/sub) ---
export interface RunUpdatedEvent {
  runId: string
  status: RunStatus
  updatedAt: string
}

export interface NodeExecutionUpdatedEvent {
  runId: string
  nodeId: string
  nodeExecutionId: string
  status: NodeExecutionStatus
  retries: number
  output?: Record<string, unknown>
  updatedAt: string
}

export interface NodeLogEvent {
  runId: string
  nodeId: string
  message: string
  level: 'info' | 'warn' | 'error' | 'debug'
  timestamp: string
}

// --- Redis Pub/Sub Channels ---
export const REDIS_CHANNELS = {
  runUpdated: (runId: string): string => `run:${runId}:updated`,
  nodeExecutionUpdated: (runId: string): string => `run:${runId}:node:updated`,
  nodeLog: (runId: string, nodeId: string): string => `run:${runId}:node:${nodeId}:log`,
} as const

// --- BullMQ Queue Names ---
export const QUEUE_NAMES = {
  NODE_EXECUTION: 'node-execution',
  TRIGGER: 'trigger',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

// --- BullMQ Job Data ---
export interface NodeExecutionJobData {
  runId: string
  nodeId: string
  nodeExecutionId: string
  nodeType: NodeType
  config: WorkflowNodeConfig
  input: Record<string, unknown>
  attempt: number
}
