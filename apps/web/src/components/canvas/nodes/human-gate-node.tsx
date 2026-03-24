import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface HumanGateNodeData {
  label?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const HumanGateNode = memo(function HumanGateNode({ data, selected }: NodeProps) {
  const d = data as HumanGateNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Human Gate'}
      typeDotColor="bg-red-500"
      typeLabel="Human Gate"
      status={d.status}
      selected={selected}
    >
      <span className="text-white/30 text-[10px] font-mono">Awaits approval</span>
    </BaseNodeCard>
  )
})
