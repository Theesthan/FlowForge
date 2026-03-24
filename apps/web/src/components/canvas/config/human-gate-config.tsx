'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'

interface HumanGateConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function HumanGateConfig({ nodeId, data, open, onClose, onSave }: HumanGateConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [prompt, setPrompt] = useState((data.prompt as string) ?? '')
  const [timeoutHours, setTimeoutHours] = useState((data.timeoutHours as number) ?? 24)
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, prompt, timeoutHours })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Human Gate'}
      typeDotColor="bg-red-500"
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
      <ConfigSection title="Review Prompt">
        <textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setDirty(true) }}
          placeholder="Please review the AI recommendation and approve or reject."
          rows={4}
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
        />
      </ConfigSection>
      <ConfigSection title="Timeout">
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={timeoutHours}
            min={1}
            max={720}
            onChange={(e) => { setTimeoutHours(Number(e.target.value)); setDirty(true) }}
            className="w-24 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/20"
          />
          <span className="text-white/40 text-xs">hours before auto-reject</span>
        </div>
      </ConfigSection>
    </PanelBase>
  )
}
