'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'

interface OutputConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

const OUTPUT_TYPES = ['email', 'notion', 'slack', 'webhook', 'complete'] as const
type OutputType = (typeof OUTPUT_TYPES)[number]

export function OutputConfig({ nodeId, data, open, onClose, onSave }: OutputConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [outputType, setOutputType] = useState<OutputType>((data.outputType as OutputType) ?? 'complete')
  const [target, setTarget] = useState((data.target as string) ?? '')
  const [template, setTemplate] = useState((data.template as string) ?? '')
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, outputType, target, template })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Output'}
      typeDotColor="bg-white"
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
      <ConfigSection title="Output Type">
        <div className="grid grid-cols-3 gap-2">
          {OUTPUT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setOutputType(t); setDirty(true) }}
              className={`py-1.5 rounded-lg text-xs capitalize transition-colors ${
                outputType === t
                  ? 'bg-white/20 border border-white/40 text-white'
                  : 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/[0.07]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </ConfigSection>
      {outputType !== 'complete' && (
        <>
          <ConfigSection title={outputType === 'slack' ? 'Channel' : outputType === 'email' ? 'Recipient' : outputType === 'notion' ? 'Page ID' : 'Webhook URL'}>
            <input
              value={target}
              onChange={(e) => { setTarget(e.target.value); setDirty(true) }}
              placeholder={outputType === 'slack' ? '#channel' : outputType === 'email' ? 'user@example.com' : '...'}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </ConfigSection>
          <ConfigSection title="Message Template">
            <textarea
              value={template}
              onChange={(e) => { setTemplate(e.target.value); setDirty(true) }}
              placeholder="Results: {{data.summary}}"
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
          </ConfigSection>
        </>
      )}
    </PanelBase>
  )
}
