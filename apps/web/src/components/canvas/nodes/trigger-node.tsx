import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface TriggerNodeData {
  label?: string
  triggerType?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const TriggerNode = memo(function TriggerNode({ data, selected }: NodeProps) {
  const d = data as TriggerNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Trigger'}
      typeDotColor="bg-green-500"
      typeLabel="Trigger"
      status={d.status}
      selected={selected}
      targetHandles={[]}
    >
      {d.triggerType && (
        <span className="text-white/30 text-[10px] font-mono capitalize">{d.triggerType as string}</span>
      )}
    </BaseNodeCard>
  )
})
