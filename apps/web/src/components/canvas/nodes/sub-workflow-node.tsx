import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard, type NodeExecutionStatus } from './base-node-card'

interface SubWorkflowNodeData {
  label?: string
  subWorkflowId?: string
  status?: NodeExecutionStatus
  [key: string]: unknown
}

export const SubWorkflowNode = memo(function SubWorkflowNode({ data, selected }: NodeProps) {
  const d = data as SubWorkflowNodeData
  return (
    <BaseNodeCard
      label={d.label ?? 'Sub Workflow'}
      typeDotColor="bg-gray-400"
      typeLabel="Sub Workflow"
      status={d.status}
      selected={selected}
    >
      {d.subWorkflowId && (
        <span className="text-white/20 text-[10px] font-mono truncate block">{d.subWorkflowId as string}</span>
      )}
    </BaseNodeCard>
  )
})
