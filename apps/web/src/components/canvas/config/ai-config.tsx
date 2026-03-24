'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'
import { FailurePolicySection, type FailurePolicy } from './failure-policy-section'

interface AIConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function AIConfig({ nodeId, data, open, onClose, onSave }: AIConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [systemPrompt, setSystemPrompt] = useState((data.systemPrompt as string) ?? '')
  const [outputSchema, setOutputSchema] = useState((data.outputSchema as string) ?? '')
  const [policy, setPolicy] = useState<FailurePolicy>({
    retries: (data.retries as number) ?? 2,
    hardFail: (data.hardFail as boolean) ?? false,
    fallbackOutput: (data.fallbackOutput as string) ?? '{"result": null}',
  })
  const [dirty, setDirty] = useState(false)

  const markDirty = (): void => setDirty(true)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, systemPrompt, outputSchema, ...policy })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'AI Node'}
      typeDotColor="bg-purple-500"
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
    >
      <ConfigSection title="Name">
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); markDirty() }}
          placeholder="Node name"
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
      </ConfigSection>

      <ConfigSection title="Configuration">
        <div className="space-y-3">
          <div>
            <label className="text-white/50 text-xs block mb-1">Model</label>
            <input
              value="llama-3.3-70b-versatile"
              readOnly
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/30 font-mono cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs block mb-1">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => { setSystemPrompt(e.target.value); markDirty() }}
              placeholder="You are a helpful assistant..."
              rows={5}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs block mb-1">Output Schema (JSON)</label>
            <textarea
              value={outputSchema}
              onChange={(e) => { setOutputSchema(e.target.value); markDirty() }}
              placeholder='{"type": "object", "properties": {}}'
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>
        </div>
      </ConfigSection>

      <FailurePolicySection value={policy} onChange={(p) => { setPolicy(p); markDirty() }} />
    </PanelBase>
  )
}
