'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Play, Clock, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type RunStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PAUSED'

interface WorkflowCardProps {
  id: string
  name: string
  description?: string
  lastRunAt?: Date | null
  lastRunStatus?: RunStatus
  nodeCount?: number
}

const statusConfig: Record<RunStatus, { icon: React.ReactNode; label: string; color: string }> = {
  IDLE: { icon: <Clock className="w-3 h-3" />, label: 'Never run', color: 'text-white/30' },
  RUNNING: { icon: <Zap className="w-3 h-3 animate-pulse" />, label: 'Running', color: 'text-cyan-400' },
  SUCCESS: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Success', color: 'text-green-400' },
  FAILED: { icon: <XCircle className="w-3 h-3" />, label: 'Failed', color: 'text-rose-400' },
  PAUSED: { icon: <Clock className="w-3 h-3" />, label: 'Paused', color: 'text-yellow-400' },
}

export function WorkflowCard({
  id,
  name,
  description,
  lastRunAt,
  lastRunStatus = 'IDLE',
  nodeCount = 0,
}: WorkflowCardProps): JSX.Element {
  const status = statusConfig[lastRunStatus]

  return (
    <Link href={`/canvas/${id}`} className="group block">
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl hover:border-white/20 transition-all duration-200 hover:bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-white font-medium text-sm truncate max-w-[180px] group-hover:text-white/90">
            {name}
          </h3>
          <div className={cn('flex items-center gap-1 text-xs shrink-0 ml-2', status.color)}>
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>

        {description && (
          <p className="text-white/40 text-xs leading-relaxed line-clamp-2 mb-3">{description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/30 text-xs font-mono">
            {nodeCount} node{nodeCount !== 1 ? 's' : ''}
          </span>
          {lastRunAt && (
            <span className="text-white/20 text-xs">
              {formatDistanceToNow(lastRunAt, { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Run button (hover reveal) */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl" />
      </div>
    </Link>
  )
}
