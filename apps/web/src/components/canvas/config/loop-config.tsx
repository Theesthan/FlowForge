'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'
import { FailurePolicySection, type FailurePolicy } from './failure-policy-section'

interface LoopConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function LoopConfig({ nodeId, data, open, onClose, onSave }: LoopConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [iterateOver, setIterateOver] = useState((data.iterateOver as string) ?? '')
  const [maxIterations, setMaxIterations] = useState((data.maxIterations as number) ?? 100)
  const [breakCondition, setBreakCondition] = useState((data.breakCondition as string) ?? '')
  const [policy, setPolicy] = useState<FailurePolicy>({
    retries: (data.retries as number) ?? 1,
    hardFail: (data.hardFail as boolean) ?? false,
    fallbackOutput: (data.fallbackOutput as string) ?? '{"result": []}',
  })
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, iterateOver, maxIterations, breakCondition, ...policy })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Loop'}
      typeDotColor="bg-orange-500"
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
      <ConfigSection title="Configuration">
        <div className="space-y-3">
          <div>
            <label className="text-white/50 text-xs block mb-1">Iterate Over (field path)</label>
            <input
              value={iterateOver}
              onChange={(e) => { setIterateOver(e.target.value); setDirty(true) }}
              placeholder="data.results"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs block mb-1">Max Iterations</label>
            <input
              type="number"
              value={maxIterations}
              min={1}
              max={1000}
              onChange={(e) => { setMaxIterations(Number(e.target.value)); setDirty(true) }}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/20"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs block mb-1">Early Break Condition</label>
            <input
              value={breakCondition}
              onChange={(e) => { setBreakCondition(e.target.value); setDirty(true) }}
              placeholder="item.score > 0.9"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
        </div>
      </ConfigSection>
      <FailurePolicySection value={policy} onChange={(p) => { setPolicy(p); setDirty(true) }} />
    </PanelBase>
  )
}
