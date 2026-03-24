import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface LoopNodeData {
  label?: string
  maxIterations?: number
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const LoopNode = memo(function LoopNode({ data, selected }: NodeProps) {
  const d = data as LoopNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Loop'}
      typeDotColor="bg-orange-500"
      typeLabel="Loop"
      status={d.status}
      selected={selected}
      sourceHandles={[
        { id: 'item', label: 'item' },
        { id: 'done', label: 'done' },
      ]}
    >
      {d.maxIterations && (
        <span className="text-white/30 text-[10px] font-mono">max {d.maxIterations as number}</span>
      )}
    </BaseNodeCard>
  )
})
