'use client'

import { useState, useCallback, useMemo } from 'react'
import { CanvasView } from '@/components/canvas/canvas-view'
import MeshGradientBackground from '@/components/ui/mesh-gradient'
import { ExecutionConsole } from '@/components/execution/execution-console'
import { HumanGateDialog } from '@/components/execution/human-gate-dialog'
import { useWorkflow } from '@/hooks/use-workflow'
import { useWorkflowRun, type NodeExecutionEvent, type RunEvent } from '@/hooks/use-workflow-run'

export default function CanvasPage({
  params,
}: {
  params: { workflowId: string }
}): JSX.Element {
  const { workflowId } = params
  const { workflow, loading, saveWorkflow } = useWorkflow(workflowId)

  const [runId, setRunId] = useState<string | null>(null)
  const [nodeExecutions, setNodeExecutions] = useState<NodeExecutionEvent[]>([])
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  // Maps nodeId → execution status so CanvasView can update node border colors
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({})

  // HumanGate dialog state — populated when run enters PAUSED state
  const [humanGate, setHumanGate] = useState<{
    nodeId: string
    nodeLabel: string
    prompt: string
    aiRecommendation?: string
  } | null>(null)

  const handleNodeExecutionUpdated = useCallback((event: NodeExecutionEvent) => {
    setNodeExecutions((prev) => {
      const idx = prev.findIndex((e) => e.nodeId === event.nodeId)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = event
        return next
      }
      return [...prev, event]
    })
    // Sync execution status into canvas node data so border colors update
    setNodeStatuses((prev) => ({ ...prev, [event.nodeId]: event.status }))
    if (event.status === 'RUNNING') setActiveNodeId(event.nodeId)
  }, [])

  // When the run enters PAUSED state, find the paused HumanGate node and open dialog
  const handleRunUpdated = useCallback(
    (event: RunEvent) => {
      if (event.status !== 'PAUSED' || !event.pausedNodeId) return

      const pausedNode = (workflow?.nodes ?? []).find((n) => n.id === event.pausedNodeId)
      if (!pausedNode) return

      const config = pausedNode.data as {
        label?: string
        promptMessage?: string
        aiRecommendationPrompt?: string
      }

      setHumanGate({
        nodeId: event.pausedNodeId,
        nodeLabel: config.label ?? pausedNode.type ?? 'Human Gate',
        prompt: config.promptMessage ?? 'Human review required before workflow continues.',
        aiRecommendation: config.aiRecommendationPrompt,
      })
    },
    [workflow?.nodes],
  )

  const { startRun, pauseRun, resumeRun, runStatus } = useWorkflowRun({
    runId,
    onNodeExecutionUpdated: handleNodeExecutionUpdated,
    onRunUpdated: handleRunUpdated,
  })

  const handleRun = useCallback(async () => {
    const id = await startRun(workflowId)
    if (id) setRunId(id)
  }, [startRun, workflowId])

  const handlePause = useCallback(async () => {
    if (runId) await pauseRun(runId)
  }, [pauseRun, runId])

  const handleHumanGateApprove = useCallback(
    async (editedOutput?: string) => {
      if (!runId) return
      const approvedOutput = editedOutput ? { decision: 'approved', editedContent: editedOutput } : { decision: 'approved' }
      await resumeRun(runId, approvedOutput)
      setHumanGate(null)
    },
    [resumeRun, runId],
  )

  const handleHumanGateReject = useCallback(async () => {
    if (!runId) return
    await resumeRun(runId, { decision: 'rejected' })
    setHumanGate(null)
  }, [resumeRun, runId])

  // Build label map from workflow nodes — memoized to prevent useEffect re-fires in ExecutionConsole
  const nodeLabels = useMemo(
    () =>
      (workflow?.nodes ?? []).reduce<Record<string, string>>((acc, n) => {
        acc[n.id] = (n.data?.label as string) ?? n.type ?? n.id
        return acc
      }, {}),
    [workflow?.nodes],
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/30 text-sm font-mono animate-pulse">Loading canvas…</div>
      </div>
    )
  }

  return (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MeshGradientBackground />
      </div>
      <CanvasView
        workflowId={workflowId}
        workflowName={workflow?.name ?? 'Untitled'}
        initialNodes={workflow?.nodes ?? []}
        initialEdges={workflow?.edges ?? []}
        onSave={saveWorkflow}
        onRun={handleRun}
        onPause={handlePause}
        isRunning={runStatus === 'RUNNING'}
        nodeStatuses={nodeStatuses}
      >
        <ExecutionConsole
          runId={runId}
          nodeExecutions={nodeExecutions}
          nodeLabels={nodeLabels}
          activeNodeId={activeNodeId}
        />
      </CanvasView>

      {humanGate && (
        <HumanGateDialog
          open={true}
          nodeLabel={humanGate.nodeLabel}
          prompt={humanGate.prompt}
          aiRecommendation={humanGate.aiRecommendation}
          onApprove={handleHumanGateApprove}
          onReject={handleHumanGateReject}
        />
      )}
    </>
  )
}
