import type { NodeTypes } from '@xyflow/react'
import { TriggerNode } from './trigger-node'
import { AINode } from './ai-node'
import { ToolNode } from './tool-node'
import { ConditionNode } from './condition-node'
import { LoopNode } from './loop-node'
import { HumanGateNode } from './human-gate-node'
import { SubWorkflowNode } from './sub-workflow-node'
import { OutputNode } from './output-node'

export const NODE_TYPES: NodeTypes = {
  TriggerNode,
  AINode,
  ToolNode,
  ConditionNode,
  LoopNode,
  HumanGateNode,
  SubWorkflowNode,
  OutputNode,
}

export {
  TriggerNode,
  AINode,
  ToolNode,
  ConditionNode,
  LoopNode,
  HumanGateNode,
  SubWorkflowNode,
  OutputNode,
}

export const NODE_TYPE_META = [
  { type: 'TriggerNode', label: 'Trigger', dotColor: 'bg-green-500', description: 'Entry point: Cron, Webhook, Gmail, RSS, Manual' },
  { type: 'AINode', label: 'AI', dotColor: 'bg-purple-500', description: 'LLM call via Groq llama-3.3-70b-versatile' },
  { type: 'ToolNode', label: 'Tool', dotColor: 'bg-blue-500', description: 'HTTP API call: Gmail, Notion, Slack, GitHub' },
  { type: 'ConditionNode', label: 'Condition', dotColor: 'bg-yellow-500', description: 'Expression evaluator with true/false paths' },
  { type: 'LoopNode', label: 'Loop', dotColor: 'bg-orange-500', description: 'Iterate over a list with item/done outputs' },
  { type: 'HumanGateNode', label: 'Human Gate', dotColor: 'bg-red-500', description: 'Pause for human approval/rejection' },
  { type: 'SubWorkflowNode', label: 'Sub Workflow', dotColor: 'bg-gray-400', description: 'Embed another workflow as a subroutine' },
  { type: 'OutputNode', label: 'Output', dotColor: 'bg-white', description: 'Terminal: email, Notion, Slack, or complete' },
] as const
