'use client'

import { useCallback, useRef } from 'react'
import { gql, useQuery, useMutation } from '@apollo/client'
import type { Node, Edge } from '@xyflow/react'

const GET_WORKFLOW = gql`
  query GetWorkflow($id: ID!) {
    workflow(id: $id) {
      id
      name
      definition
      updatedAt
    }
  }
`

const UPDATE_WORKFLOW = gql`
  mutation UpdateWorkflow($id: ID!, $definition: JSON!, $name: String) {
    updateWorkflow(id: $id, definition: $definition, name: $name) {
      id
      definition
      updatedAt
    }
  }
`

const CREATE_WORKFLOW = gql`
  mutation CreateWorkflow($name: String!, $definition: JSON, $orgId: ID!) {
    createWorkflow(name: $name, definition: $definition, orgId: $orgId) {
      id
      name
      definition
    }
  }
`

interface WorkflowData {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
}

interface UseWorkflowReturn {
  workflow: WorkflowData | null
  loading: boolean
  error: Error | null
  saveWorkflow: (nodes: Node[], edges: Edge[]) => void
}

export function useWorkflow(workflowId: string): UseWorkflowReturn {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, loading, error } = useQuery(GET_WORKFLOW, {
    variables: { id: workflowId },
    skip: !workflowId || workflowId === 'new',
  })

  const [updateWorkflow] = useMutation(UPDATE_WORKFLOW)

  const saveWorkflow = useCallback(
    (nodes: Node[], edges: Edge[]): void => {
      if (!workflowId || workflowId === 'new') return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void updateWorkflow({
          variables: {
            id: workflowId,
            definition: JSON.stringify({ nodes, edges }),
          },
        })
      }, 1500)
    },
    [workflowId, updateWorkflow],
  )

  const rawDef = data?.workflow?.definition
  let parsed: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] }
  if (rawDef) {
    try {
      parsed = typeof rawDef === 'string' ? (JSON.parse(rawDef) as { nodes: Node[]; edges: Edge[] }) : rawDef
    } catch {
      parsed = { nodes: [], edges: [] }
    }
  }

  return {
    workflow: data?.workflow
      ? { id: data.workflow.id as string, name: data.workflow.name as string, ...parsed }
      : null,
    loading,
    error: error ?? null,
    saveWorkflow,
  }
}

export { CREATE_WORKFLOW }
