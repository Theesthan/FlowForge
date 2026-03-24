'use client'

import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { Play, Pause, LogOut, Settings, Workflow } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { NODE_TYPES } from './nodes'
import { NodePalette } from './node-palette'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import MeshGradientBackground from '@/components/ui/mesh-gradient'
import FloatingActionMenu from '@/components/ui/floating-action-menu'
import { CommandPalette } from '@/components/ui/command-palette'
import { wouldCreateCycle } from '@/hooks/use-dag-validation'
import { signOut } from '@/lib/firebase'
import { NodeConfigPanel } from './config/node-config-panel'

interface CanvasViewProps {
  workflowId: string
  workflowName: string
  initialNodes?: Node[]
  initialEdges?: Parameters<typeof useEdgesState>[0]
  onSave?: (nodes: Node[], edges: ReturnType<typeof useEdgesState>[0]) => void
  onRun?: () => void
  onPause?: () => void
  isRunning?: boolean
  children?: React.ReactNode
}

export function CanvasView({
  workflowId,
  workflowName,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onRun,
  onPause,
  isRunning = false,
  children,
}: CanvasViewProps): JSX.Element {
  const router = useRouter()
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      if (wouldCreateCycle(edges, { source: connection.source, target: connection.target })) {
        toast.error('Cycles are not allowed — workflow must be a DAG.')
        return
      }
      setEdges((eds) => addEdge(connection, eds))
    },
    [edges, setEdges],
  )

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type || !rfInstanceRef.current) return

      const position = rfInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: nanoid(8),
        type,
        position,
        data: { label: type.replace('Node', '') },
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes],
  )

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const addNodeFromPalette = useCallback(
    (type: string) => {
      const position = { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 }
      const newNode: Node = {
        id: nanoid(8),
        type,
        position,
        data: { label: type.replace('Node', '') },
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes],
  )

  const handleNodeDataSave = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data } : n))
      )
      setSelectedNodeId(null)
    },
    [setNodes],
  )

  const handleSave = useCallback(() => {
    onSave?.(nodes, edges)
    toast.success('Workflow saved')
  }, [nodes, edges, onSave])

  const handleSignOut = async (): Promise<void> => {
    await signOut()
    router.replace('/login')
  }

  const commandWorkflowActions = [
    { id: 'run', label: isRunning ? 'Pause Workflow' : 'Run Workflow', shortcut: '⌘↵', onSelect: () => isRunning ? onPause?.() : onRun?.() },
    { id: 'save', label: 'Save', shortcut: '⌘S', onSelect: handleSave },
    { id: 'fit', label: 'Fit View', shortcut: '⌘⇧F', onSelect: () => rfInstanceRef.current?.fitView() },
  ]

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* WebGL background — behind React Flow */}
      <div className="absolute inset-0 z-0">
        <MeshGradientBackground />
      </div>

      {/* React Flow */}
      <div className="absolute inset-0 z-10">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => { rfInstanceRef.current = instance }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={NODE_TYPES}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          proOptions={{ hideAttribution: true }}
          className="!bg-transparent"
          deleteKeyCode="Backspace"
          fitView
        >
          <Background variant={BackgroundVariant.Dots} color="#ffffff20" gap={24} />
          <Controls className="!bg-[#0a0a0a]/80 !border-white/10 !rounded-xl" />
          <MiniMap
            className="!bg-[#0a0a0a]/80 !border !border-white/10 !rounded-xl"
            nodeColor="#ffffff20"
            maskColor="rgba(0,0,0,0.8)"
          />
        </ReactFlow>
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <span className="text-white/50 text-sm font-medium bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
          {workflowName}
        </span>
        <HoverBorderGradient
          as="button"
          type="button"
          onClick={isRunning ? onPause : onRun}
          containerClassName="rounded-full"
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium"
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Run
            </>
          )}
        </HoverBorderGradient>
      </div>

      {/* Node palette — left side */}
      <div className="z-20">
        <NodePalette onAddNode={addNodeFromPalette} />
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        options={[
          {
            label: 'Dashboard',
            Icon: <Workflow className="w-4 h-4" />,
            onClick: () => router.push('/dashboard'),
          },
          {
            label: 'Settings',
            Icon: <Settings className="w-4 h-4" />,
            onClick: () => toast.info('Settings coming soon'),
          },
          {
            label: 'Logout',
            Icon: <LogOut className="w-4 h-4" />,
            onClick: handleSignOut,
          },
        ]}
      />

      {/* Command palette — triggered by Cmd+K */}
      <CommandPalette
        workflowActions={commandWorkflowActions}
        viewActions={[
          { id: 'fitview', label: 'Fit View', shortcut: '⌘⇧F', onSelect: () => rfInstanceRef.current?.fitView() },
        ]}
        exportActions={[
          {
            id: 'export-json',
            label: 'Export as JSON',
            onSelect: () => {
              const json = JSON.stringify({ nodes, edges }, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${workflowName}.json`
              a.click()
            },
          },
        ]}
      />

      {/* Node config panel — slides in from right when a node is selected */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <NodeConfigPanel
            selectedNode={selectedNodeId ? (nodes.find((n) => n.id === selectedNodeId) ?? null) : null}
            onClose={() => setSelectedNodeId(null)}
            onSave={handleNodeDataSave}
          />
        </div>
      </div>

      {/* Slot for execution console */}
      {children}
    </div>
  )
}
