'use client'

import { useRouter } from 'next/navigation'
import type { WorkflowTemplate } from '@/lib/templates'

interface TemplateCardProps {
  template: WorkflowTemplate
}

export function TemplateCard({ template }: TemplateCardProps): JSX.Element {
  const router = useRouter()

  return (
    <div className="group relative bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-xl hover:border-white/20 transition-all duration-200 cursor-default">
      {/* Icon + name */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none">{template.icon}</span>
        <div className="min-w-0">
          <h3 className="text-white font-medium text-sm">{template.name}</h3>
          <span className="text-white/30 text-xs font-mono">{template.category}</span>
        </div>
      </div>

      <p className="text-white/40 text-xs leading-relaxed mb-4">{template.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-white/20 text-xs font-mono">{template.nodeCount} nodes</span>
        <button
          type="button"
          onClick={() => router.push(`/canvas/new?template=${template.id}`)}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
        >
          Use Template →
        </button>
      </div>

      {/* Glow border reveal */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  )
}
