'use client'

import { useState } from 'react'
import { PanelBase, ConfigSection } from './panel-base'

interface ConditionConfigProps {
  nodeId: string
  data: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function ConditionConfig({ nodeId, data, open, onClose, onSave }: ConditionConfigProps): JSX.Element {
  const [label, setLabel] = useState((data.label as string) ?? '')
  const [expression, setExpression] = useState((data.expression as string) ?? '')
  const [dirty, setDirty] = useState(false)

  const handleSave = (): void => {
    onSave(nodeId, { ...data, label, expression })
    setDirty(false)
    onClose()
  }

  return (
    <PanelBase
      open={open}
      title={label || 'Condition'}
      typeDotColor="bg-yellow-500"
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
      <ConfigSection title="Expression">
        <input
          value={expression}
          onChange={(e) => { setExpression(e.target.value); setDirty(true) }}
          placeholder='score > 0.8'
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
        />
        <p className="text-white/20 text-[10px] mt-1">
          Use dot-notation to reference previous node outputs. e.g. <code className="font-mono">data.score {'>'} 0.5</code>
        </p>
        <div className="mt-3 flex gap-4 text-xs text-white/30">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />true path</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" />false path</span>
        </div>
      </ConfigSection>
    </PanelBase>
  )
}
