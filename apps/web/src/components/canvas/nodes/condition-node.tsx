import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface ConditionNodeData {
  label?: string
  expression?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps) {
  const d = data as ConditionNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Condition'}
      typeDotColor="bg-yellow-500"
      typeLabel="Condition"
      status={d.status}
      selected={selected}
      sourceHandles={[
        { id: 'true', label: 'true' },
        { id: 'false', label: 'false' },
      ]}
    >
      {d.expression && (
        <code className="text-white/30 text-[10px] font-mono truncate block">{d.expression as string}</code>
      )}
    </BaseNodeCard>
  )
})
