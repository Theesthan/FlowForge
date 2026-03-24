import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface ToolNodeData {
  label?: string
  toolType?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const ToolNode = memo(function ToolNode({ data, selected }: NodeProps) {
  const d = data as ToolNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Tool Node'}
      typeDotColor="bg-blue-500"
      typeLabel="Tool"
      status={d.status}
      selected={selected}
    >
      {d.toolType && (
        <span className="text-white/30 text-[10px] font-mono capitalize">{d.toolType as string}</span>
      )}
    </BaseNodeCard>
  )
})
