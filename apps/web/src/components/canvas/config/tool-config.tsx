'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'
import { FailurePolicySection, type FailurePolicy } from './failure-policy-section'

interface ToolConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

const TOOL_TYPES = ['http', 'gmail', 'notion', 'slack', 'github'] as const
type ToolType = (typeof TOOL_TYPES)[number]

export function ToolConfig({ nodeId, data, open, onClose, onSave }: ToolConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [toolType, setToolType] = useState<ToolType>((data.toolType as ToolType) ?? 'http')
  const [url, setUrl] = useState((data.url as string) ?? '')
  const [method, setMethod] = useState((data.method as string) ?? 'GET')
  const [headers, setHeaders] = useState((data.headers as string) ?? '{}')
  const [policy, setPolicy] = useState<FailurePolicy>({
    retries: (data.retries as number) ?? 2,
    hardFail: (data.hardFail as boolean) ?? false,
    fallbackOutput: (data.fallbackOutput as string) ?? '{"result": null}',
  })
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, toolType, url, method, headers, ...policy })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Tool Node'}
      typeDotColor="bg-blue-500"
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

      <ConfigSection title="Tool Type">
        <div className="grid grid-cols-3 gap-2">
          {TOOL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setToolType(t); setDirty(true) }}
              className={`py-1.5 rounded-lg text-xs capitalize transition-colors ${
                toolType === t
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  : 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/[0.07]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </ConfigSection>

      {toolType === 'http' && (
        <ConfigSection title="HTTP Configuration">
          <div className="space-y-2">
            <div className="flex gap-2">
              {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMethod(m); setDirty(true) }}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                    method === m
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-white/[0.03] text-white/30 hover:bg-white/[0.07]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setDirty(true) }}
              placeholder="https://api.example.com/endpoint"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
            <textarea
              value={headers}
              onChange={(e) => { setHeaders(e.target.value); setDirty(true) }}
              placeholder='{"Authorization": "Bearer {{token}}"}'
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>
        </ConfigSection>
      )}

      <FailurePolicySection value={policy} onChange={(p) => { setPolicy(p); setDirty(true) }} />
    </PanelBase>
  )
}
