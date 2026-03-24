'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'
import { FailurePolicySection, type FailurePolicy } from './failure-policy-section'

interface SubWorkflowConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function SubWorkflowConfig({ nodeId, data, open, onClose, onSave }: SubWorkflowConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [subWorkflowId, setSubWorkflowId] = useState((data.subWorkflowId as string) ?? '')
  const [inputMapping, setInputMapping] = useState((data.inputMapping as string) ?? '{}')
  const [outputMapping, setOutputMapping] = useState((data.outputMapping as string) ?? '{}')
  const [policy, setPolicy] = useState<FailurePolicy>({
    retries: (data.retries as number) ?? 1,
    hardFail: (data.hardFail as boolean) ?? false,
    fallbackOutput: (data.fallbackOutput as string) ?? '{"result": null}',
  })
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, subWorkflowId, inputMapping, outputMapping, ...policy })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Sub Workflow'}
      typeDotColor="bg-gray-400"
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
    >
      <ConfigSection title="Name">
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); setDirty(true) }}
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
      </ConfigSection>
      <ConfigSection title="Sub Workflow ID">
        <input
          value={subWorkflowId}
          onChange={(e) => { setSubWorkflowId(e.target.value); setDirty(true) }}
          placeholder="Workflow ID from dashboard"
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
      </ConfigSection>
      <ConfigSection title="Input Mapping (JSON)">
        <textarea
          value={inputMapping}
          onChange={(e) => { setInputMapping(e.target.value); setDirty(true) }}
          placeholder='{"param": "{{data.value}}"}'
          rows={3}
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
        />
      </ConfigSection>
      <ConfigSection title="Output Mapping (JSON)">
        <textarea
          value={outputMapping}
          onChange={(e) => { setOutputMapping(e.target.value); setDirty(true) }}
          placeholder='{"result": "output.result"}'
          rows={3}
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
        />
      </ConfigSection>
      <FailurePolicySection value={policy} onChange={(p) => { setPolicy(p); setDirty(true) }} />
    </PanelBase>
  )
}
