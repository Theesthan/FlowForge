'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'
import { FailurePolicySection, type FailurePolicy } from './failure-policy-section'

interface OutputConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

const OUTPUT_TYPES = ['complete', 'slack', 'email', 'notion', 'webhook'] as const
type OutputType = (typeof OUTPUT_TYPES)[number]

export function OutputConfig({ nodeId, data, open, onClose, onSave }: OutputConfigProps): JSX.Element {
  // Derive outputType from the stored outputTargets array (first item) or legacy outputType field
  const storedTargets = data.outputTargets as string[] | undefined
  const initialType: OutputType =
    (storedTargets?.[0] as OutputType) ??
    (data.outputType as OutputType) ??
    'complete'

  const [label, setLabel] = useState((data.label as string) ?? '')
  const [outputType, setOutputType] = useState<OutputType>(initialType)
  // Per-type fields — map to the field names the executor reads
  const [slackChannel, setSlackChannel] = useState((data.slackChannel as string) ?? '')
  const [slackMessage, setSlackMessage] = useState((data.slackMessage as string) ?? '')
  const [emailTo, setEmailTo] = useState((data.emailTo as string) ?? '')
  const [emailSubject, setEmailSubject] = useState((data.emailSubject as string) ?? '')
  const [notionDatabaseId, setNotionDatabaseId] = useState((data.notionDatabaseId as string) ?? '')
  const [notionTitle, setNotionTitle] = useState((data.notionTitle as string) ?? '')
  const [webhookUrl, setWebhookUrl] = useState((data.url as string) ?? '')
  const [policy, setPolicy] = useState<FailurePolicy>({
    retries: (data.retries as number) ?? 1,
    hardFail: (data.hardFail as boolean) ?? false,
    fallbackOutput: (data.fallbackOutput as string) ?? '{"completed": false}',
  })
  const [dirty, setDirty] = useState(false)

  const markDirty = (): void => setDirty(true)

  const handleSave = (): void => {
    onSave(nodeId, {
      ...data,
      label,
      // executor reads outputTargets as an array
      outputTargets: [outputType],
      // per-type executor fields
      slackChannel,
      slackMessage,
      emailTo,
      emailSubject,
      notionDatabaseId,
      notionTitle,
      url: webhookUrl,
      ...policy,
    })
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
          onChange={(e) => { setLabel(e.target.value); markDirty() }}
          placeholder="Node name"
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
      </ConfigSection>

      <ConfigSection title="Output Type">
        <div className="grid grid-cols-3 gap-2">
          {OUTPUT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setOutputType(t); markDirty() }}
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

      {outputType === 'slack' && (
        <>
          <ConfigSection title="Slack Channel">
            <input
              value={slackChannel}
              onChange={(e) => { setSlackChannel(e.target.value); markDirty() }}
              placeholder="#channel-name or C0XXXXXXX"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
            <p className="text-white/20 text-[10px]">Requires SLACK_BOT_TOKEN env var (or set SLACK_WEBHOOK_URL to skip channel)</p>
          </ConfigSection>
          <ConfigSection title="Message Template">
            <textarea
              value={slackMessage}
              onChange={(e) => { setSlackMessage(e.target.value); markDirty() }}
              placeholder="Results: {{text}}"
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
          </ConfigSection>
        </>
      )}

      {outputType === 'email' && (
        <>
          <ConfigSection title="Recipient (emailTo)">
            <input
              value={emailTo}
              onChange={(e) => { setEmailTo(e.target.value); markDirty() }}
              placeholder="user@example.com"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </ConfigSection>
          <ConfigSection title="Subject Template">
            <input
              value={emailSubject}
              onChange={(e) => { setEmailSubject(e.target.value); markDirty() }}
              placeholder="FlowForge Output — {{triggerTime}}"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </ConfigSection>
        </>
      )}

      {outputType === 'notion' && (
        <>
          <ConfigSection title="Notion Database ID">
            <input
              value={notionDatabaseId}
              onChange={(e) => { setNotionDatabaseId(e.target.value); markDirty() }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </ConfigSection>
          <ConfigSection title="Page Title Template">
            <input
              value={notionTitle}
              onChange={(e) => { setNotionTitle(e.target.value); markDirty() }}
              placeholder="FlowForge Output — {{triggerTime}}"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </ConfigSection>
        </>
      )}

      {outputType === 'webhook' && (
        <ConfigSection title="Webhook URL">
          <input
            value={webhookUrl}
            onChange={(e) => { setWebhookUrl(e.target.value); markDirty() }}
            placeholder="https://hooks.example.com/..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
          />
        </ConfigSection>
      )}

      {outputType === 'complete' && (
        <p className="text-white/20 text-xs px-1">
          Logs the workflow result to the execution console. No external delivery.
        </p>
      )}

      <FailurePolicySection value={policy} onChange={(p) => { setPolicy(p); markDirty() }} />
    </PanelBase>
  )
}
