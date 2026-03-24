'use client'

import { use, useState, useCallback } from 'react'
import { CanvasView } from '@/components/canvas/canvas-view'
import { ExecutionConsole } from '@/components/execution/execution-console'
import { HumanGateDialog } from '@/components/execution/human-gate-dialog'
import { useWorkflow } from '@/hooks/use-workflow'
import { useWorkflowRun, type NodeExecutionEvent } from '@/hooks/use-workflow-run'

export default function CanvasPage({
  params,
}: {
  params: Promise<{ workflowId: string }>
}): JSX.Element {
  const { workflowId } = use(params)
  const { workflow, loading, saveWorkflow } = useWorkflow(workflowId)

  const [runId, setRunId] = useState<string | null>(null)
  const [nodeExecutions, setNodeExecutions] = useState<NodeExecutionEvent[]>([])
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
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
    if (event.status === 'RUNNING') setActiveNodeId(event.nodeId)
  }, [])

  const { startRun, pauseRun, runStatus } = useWorkflowRun({
    runId,
    onNodeExecutionUpdated: handleNodeExecutionUpdated,
  })

  const handleRun = useCallback(async () => {
    const id = await startRun(workflowId)
    if (id) setRunId(id)
  }, [startRun, workflowId])

  const handlePause = useCallback(async () => {
    if (runId) await pauseRun(runId)
  }, [pauseRun, runId])

  // Build label map from workflow nodes (stale-ok; used only for log display)
  const nodeLabels = (workflow?.nodes ?? []).reduce<Record<string, string>>((acc, n) => {
    acc[n.id] = (n.data?.label as string) ?? n.type ?? n.id
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/30 text-sm font-mono animate-pulse">Loading canvas…</div>
      </div>
    )
  }

  return (
    <>
      <CanvasView
        workflowId={workflowId}
        workflowName={workflow?.name ?? 'Untitled'}
        initialNodes={workflow?.nodes ?? []}
        initialEdges={workflow?.edges ?? []}
        onSave={saveWorkflow}
        onRun={handleRun}
        onPause={handlePause}
        isRunning={runStatus === 'RUNNING'}
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
          onApprove={() => setHumanGate(null)}
          onReject={() => setHumanGate(null)}
        />
      )}
    </>
  )
}
