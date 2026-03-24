'use client'

import { ConfigSection } from './panel-base'

export interface FailurePolicy {
  retries: number
  hardFail: boolean
  fallbackOutput: string
}

interface FailurePolicySectionProps {
  value: FailurePolicy
  onChange: (updated: FailurePolicy) => void
}

export function FailurePolicySection({ value, onChange }: FailurePolicySectionProps): JSX.Element {
  return (
    <ConfigSection title="Failure Policy">
      {/* Retries */}
      <div className="space-y-1">
        <label className="text-white/50 text-xs">Retries (0–3)</label>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...value, retries: n })}
              className={`w-9 h-9 rounded-lg text-sm font-mono transition-colors ${
                value.retries === n
                  ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                  : 'bg-white/[0.03] border border-white/10 text-white/40 hover:bg-white/[0.07]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Hard Fail toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs">Hard Fail</p>
          <p className="text-white/20 text-[10px]">Stop workflow on repeated failure</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, hardFail: !value.hardFail })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            value.hardFail ? 'bg-rose-500/60' : 'bg-white/10'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
              value.hardFail ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Fallback output */}
      <div className="space-y-1">
        <label className="text-white/50 text-xs">Fallback Output (JSON)</label>
        <textarea
          value={value.fallbackOutput}
          onChange={(e) => onChange({ ...value, fallbackOutput: e.target.value })}
          placeholder='{"result": null}'
          rows={2}
          className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
        />
      </div>
    </ConfigSection>
  )
}
