'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'

interface TriggerConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

const TRIGGER_TYPES = ['cron', 'webhook', 'manual', 'rss', 'gmail'] as const
type TriggerType = (typeof TRIGGER_TYPES)[number]

export function TriggerConfig({ nodeId, data, open, onClose, onSave }: TriggerConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [triggerType, setTriggerType] = useState<TriggerType>((data.triggerType as TriggerType) ?? 'manual')
  const [cronExpr, setCronExpr] = useState((data.cronExpression as string) ?? '0 9 * * *')
  const [webhookPath, setWebhookPath] = useState((data.path as string) ?? '/webhook')
  const [rssUrl, setRssUrl] = useState((data.url as string) ?? '')
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, triggerType, cronExpression: cronExpr, path: webhookPath, url: rssUrl })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Trigger'}
      typeDotColor="bg-green-500"
      onClose={onClose}
      onSave={handleSave}
      dirty={dirty}
    >
      <ConfigSection title="Name">
        <input
          value={label}
          onChange={(e) => { setLabel(e.target.value); setDirty(true) }}
          placeholder="Node name"
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
      </ConfigSection>

      <ConfigSection title="Trigger Type">
        <div className="grid grid-cols-3 gap-2">
          {TRIGGER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTriggerType(t); setDirty(true) }}
              className={`py-1.5 rounded-lg text-xs capitalize transition-colors ${
                triggerType === t
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/[0.07]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </ConfigSection>

      {triggerType === 'cron' && (
        <ConfigSection title="Cron Expression">
          <input
            value={cronExpr}
            onChange={(e) => { setCronExpr(e.target.value); setDirty(true) }}
            placeholder="0 9 * * *"
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
          <p className="text-white/20 text-[10px]">e.g. &quot;0 9 * * *&quot; = every day at 9 AM</p>
        </ConfigSection>
      )}

      {triggerType === 'webhook' && (
        <ConfigSection title="Webhook Path">
          <input
            value={webhookPath}
            onChange={(e) => { setWebhookPath(e.target.value); setDirty(true) }}
            placeholder="/webhook"
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
        </ConfigSection>
      )}

      {(triggerType === 'rss' || triggerType === 'gmail') && (
        <ConfigSection title={triggerType === 'rss' ? 'RSS Feed URL' : 'Gmail Filter'}>
          <input
            value={rssUrl}
            onChange={(e) => { setRssUrl(e.target.value); setDirty(true) }}
            placeholder={triggerType === 'rss' ? 'https://...' : 'subject:internship'}
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
        </ConfigSection>
      )}
    </PanelBase>
  )
}
