/**
 * DAG Validator
 * Implements Kahn's algorithm (BFS topological sort) to detect cycles.
 * Also validates required fields per node type.
 */
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeType } from '@flowforge/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// Minimum required config fields per node type
const REQUIRED_CONFIG: Partial<Record<NodeType, string[]>> = {
  TriggerNode: ['triggerType'],
  AINode: ['systemPrompt'],
  ToolNode: ['url', 'method'],
  ConditionNode: ['expression'],
  LoopNode: ['iterateOver'],
  HumanGateNode: ['promptMessage'],
  SubWorkflowNode: ['subWorkflowId'],
  OutputNode: ['outputTargets'],
}

function detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adj = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  for (const n of nodes) {
    adj.set(n.id, [])
    indegree.set(n.id, 0)
  }

  for (const e of edges) {
    adj.get(e.source)?.push(e.target)
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [id, deg] of indegree) {
    if (deg === 0) queue.push(id)
  }

  let visited = 0
  while (queue.length > 0) {
    const cur = queue.shift()!
    visited++
    for (const next of (adj.get(cur) ?? [])) {
      const newDeg = (indegree.get(next) ?? 0) - 1
      indegree.set(next, newDeg)
      if (newDeg === 0) queue.push(next)
    }
  }

  return visited !== nodes.length
}

export function validateDAG(def: WorkflowDefinition): ValidationResult {
  const errors: string[] = []

  if (!def.nodes || def.nodes.length === 0) {
    return { valid: false, errors: ['Workflow must have at least one node'] }
  }

  // Validate node IDs are unique
  const nodeIds = new Set<string>()
  for (const n of def.nodes) {
    if (!n.id) { errors.push('A node is missing its id'); continue }
    if (!n.type) errors.push(`Node ${n.id} is missing type`)
    if (!n.label) errors.push(`Node ${n.id} is missing label`)
    if (nodeIds.has(n.id)) errors.push(`Duplicate node id: ${n.id}`)
    nodeIds.add(n.id)

    // Type-specific required fields (warn only — don't hard-fail unconfigured nodes)
    const required = REQUIRED_CONFIG[n.type] ?? []
    for (const field of required) {
      if (n.config[field as keyof typeof n.config] == null) {
        errors.push(`Node "${n.label}" (${n.type}) is missing required field: ${field}`)
      }
    }
  }

  // Validate edge endpoints reference real nodes
  const edgeIds = new Set<string>()
  for (const e of (def.edges ?? [])) {
    if (!e.id) { errors.push('An edge is missing its id'); continue }
    if (edgeIds.has(e.id)) errors.push(`Duplicate edge id: ${e.id}`)
    edgeIds.add(e.id)
    if (!nodeIds.has(e.source)) errors.push(`Edge ${e.id} has unknown source: ${e.source}`)
    if (!nodeIds.has(e.target)) errors.push(`Edge ${e.id} has unknown target: ${e.target}`)
  }

  // Check for cycles using Kahn's algorithm
  if (detectCycle(def.nodes, def.edges ?? [])) {
    errors.push('Workflow contains a cycle — the graph must be a DAG (acyclic)')
  }

  return { valid: errors.length === 0, errors }
}
