import { useCallback } from 'react'
import { gql, useMutation, useSubscription } from '@apollo/client'

const CREATE_RUN = gql`
  mutation CreateRun($workflowId: ID!) {
    createRun(workflowId: $workflowId) {
      id
      status
      startedAt
    }
  }
`

const PAUSE_RUN = gql`
  mutation PauseRun($runId: ID!) {
    pauseRun(runId: $runId) {
      id
      status
    }
  }
`

const RESUME_RUN = gql`
  mutation ResumeRun($runId: ID!) {
    resumeRun(runId: $runId) {
      id
      status
    }
  }
`

export const WORKFLOW_RUN_UPDATED = gql`
  subscription WorkflowRunUpdated($runId: ID!) {
    workflowRunUpdated(runId: $runId) {
      id
      status
      startedAt
      endedAt
    }
  }
`

export const NODE_EXECUTION_UPDATED = gql`
  subscription NodeExecutionUpdated($runId: ID!) {
    nodeExecutionUpdated(runId: $runId) {
      id
      nodeId
      status
      input
      output
      retries
      startedAt
      endedAt
    }
  }
`

export const NODE_LOG_STREAM = gql`
  subscription NodeLogStream($runId: ID!, $nodeId: ID!) {
    nodeLogStream(runId: $runId, nodeId: $nodeId) {
      token
      timestamp
    }
  }
`

export type RunStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'SUCCESS' | 'FAILED'
export type NodeExecStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'FALLBACK'

export interface NodeExecutionEvent {
  id: string
  nodeId: string
  status: NodeExecStatus
  input: string | null
  output: string | null
  retries: number
  startedAt: string
  endedAt: string | null
}

export interface LogToken {
  token: string
  timestamp: string
}

interface UseWorkflowRunOptions {
  runId: string | null
  onNodeExecutionUpdated?: (event: NodeExecutionEvent) => void
}

export function useWorkflowRun({ runId, onNodeExecutionUpdated }: UseWorkflowRunOptions) {
  const [createRunMutation] = useMutation(CREATE_RUN)
  const [pauseRunMutation] = useMutation(PAUSE_RUN)
  const [resumeRunMutation] = useMutation(RESUME_RUN)

  const { data: runData } = useSubscription(WORKFLOW_RUN_UPDATED, {
    variables: { runId },
    skip: !runId,
  })

  useSubscription(NODE_EXECUTION_UPDATED, {
    variables: { runId },
    skip: !runId,
    onData: ({ data }) => {
      const event = data.data?.nodeExecutionUpdated as NodeExecutionEvent | undefined
      if (event) onNodeExecutionUpdated?.(event)
    },
  })

  const startRun = useCallback(
    async (workflowId: string): Promise<string | null> => {
      const { data } = await createRunMutation({ variables: { workflowId } })
      return (data?.createRun?.id as string) ?? null
    },
    [createRunMutation],
  )

  const pauseRun = useCallback(
    async (id: string): Promise<void> => {
      await pauseRunMutation({ variables: { runId: id } })
    },
    [pauseRunMutation],
  )

  const resumeRun = useCallback(
    async (id: string): Promise<void> => {
      await resumeRunMutation({ variables: { runId: id } })
    },
    [resumeRunMutation],
  )

  const runStatus = (runData?.workflowRunUpdated?.status as RunStatus) ?? 'IDLE'

  return { startRun, pauseRun, resumeRun, runStatus }
}
