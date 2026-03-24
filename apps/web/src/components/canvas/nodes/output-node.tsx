import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface OutputNodeData {
  label?: string
  outputType?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps) {
  const d = data as OutputNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Output'}
      typeDotColor="bg-white"
      typeLabel="Output"
      status={d.status}
      selected={selected}
      sourceHandles={[]}
    >
      {d.outputType && (
        <span className="text-white/30 text-[10px] font-mono capitalize">{d.outputType as string}</span>
      )}
    </BaseNodeCard>
  )
})
