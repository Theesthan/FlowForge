import type { Edge } from '@xyflow/react'

/**
 * DFS-based cycle detection for the workflow DAG.
 * Returns true if adding `newEdge` would create a cycle.
 */
export function wouldCreateCycle(edges: Edge[], newEdge: { source: string; target: string }): boolean {
  // Build adjacency list from existing edges + proposed new edge
  const adj: Map<string, Set<string>> = new Map()

  const addEdge = (src: string, tgt: string): void => {
    if (!adj.has(src)) adj.set(src, new Set())
    adj.get(src)!.add(tgt)
  }

  for (const e of edges) {
    addEdge(e.source, e.target)
  }
  addEdge(newEdge.source, newEdge.target)

  // DFS from newEdge.target — if we can reach newEdge.source, it's a cycle
  const visited = new Set<string>()

  function dfs(node: string): boolean {
    if (node === newEdge.source) return true
    if (visited.has(node)) return false
    visited.add(node)
    for (const neighbor of adj.get(node) ?? []) {
      if (dfs(neighbor)) return true
    }
    return false
  }

  return dfs(newEdge.target)
}
