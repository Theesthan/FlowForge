import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface AINodeData {
  label?: string
  model?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const AINode = memo(function AINode({ data, selected }: NodeProps) {
  const d = data as AINodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'AI Node'}
      typeDotColor="bg-purple-500"
      typeLabel="AI"
      status={d.status}
      selected={selected}
    >
      <span className="text-white/20 text-[10px] font-mono truncate block">{d.model ?? 'llama-3.3-70b-versatile'}</span>
    </BaseNodeCard>
  )
})
