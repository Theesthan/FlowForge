'use client'

import type { Node } from '@xyflow/react'
import { TriggerConfig } from './trigger-config'
import { AIConfig } from './ai-config'
import { ToolConfig } from './tool-config'
import { ConditionConfig } from './condition-config'
import { LoopConfig } from './loop-config'
import { HumanGateConfig } from './human-gate-config'
import { SubWorkflowConfig } from './sub-workflow-config'
import { OutputConfig } from './output-config'

interface NodeConfigPanelProps {
  selectedNode: Node | null
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function NodeConfigPanel({ selectedNode, onClose, onSave }: NodeConfigPanelProps): JSX.Element | null {
  if (!selectedNode) return null

  const data = (selectedNode.data ?? {}) as Record<string, unknown>
  const commonProps = { nodeId: selectedNode.id, data, open: true, onClose, onSave }

  switch (selectedNode.type) {
    case 'TriggerNode':
      return <TriggerConfig {...commonProps} />
    case 'AINode':
      return <AIConfig {...commonProps} />
    case 'ToolNode':
      return <ToolConfig {...commonProps} />
    case 'ConditionNode':
      return <ConditionConfig {...commonProps} />
    case 'LoopNode':
      return <LoopConfig {...commonProps} />
    case 'HumanGateNode':
      return <HumanGateConfig {...commonProps} />
    case 'SubWorkflowNode':
      return <SubWorkflowConfig {...commonProps} />
    case 'OutputNode':
      return <OutputConfig {...commonProps} />
    default:
      return null
  }
}
