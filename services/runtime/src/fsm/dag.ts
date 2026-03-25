/**
 * DAG utilities for the FSM engine.
 * Topological sort, successor/predecessor resolution.
 */
import type { WorkflowEdge } from '@flowforge/types'

/** Topological order of nodeIds using Kahn's algorithm */
export function topoSort(nodeIds: string[], edges: WorkflowEdge[]): string[] {
  const adj = new Map<string, string[]>()
  const indegree = new Map<string, number>()

  for (const id of nodeIds) {
    adj.set(id, [])
    indegree.set(id, 0)
  }

  for (const e of edges) {
    adj.get(e.source)?.push(e.target)
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1)
  }

  const queue = nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0)
  const result: string[] = []

  while (queue.length > 0) {
    const cur = queue.shift()!
    result.push(cur)
    for (const next of adj.get(cur) ?? []) {
      const deg = (indegree.get(next) ?? 0) - 1
      indegree.set(next, deg)
      if (deg === 0) queue.push(next)
    }
  }

  return result
}

/**
 * Returns successor node IDs from a given node.
 * conditionResult: 'true' | 'false' — used to filter ConditionNode edges.
 */
export function getSuccessors(
  nodeId: string,
  edges: WorkflowEdge[],
  conditionResult?: string,
): string[] {
  return edges
    .filter((e) => {
      if (e.source !== nodeId) return false
      if (e.condition != null && conditionResult != null) {
        return e.condition === conditionResult
      }
      return true
    })
    .map((e) => e.target)
}

/** Returns all predecessor node IDs for a given node */
export function getPredecessors(nodeId: string, edges: WorkflowEdge[]): string[] {
  return edges.filter((e) => e.target === nodeId).map((e) => e.source)
}

/** Entry nodes are those with no incoming edges */
export function getEntryNodes(nodeIds: string[], edges: WorkflowEdge[]): string[] {
  const targets = new Set(edges.map((e) => e.target))
  return nodeIds.filter((id) => !targets.has(id))
}
