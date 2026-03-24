'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

export type NodeExecutionStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'FALLBACK'

const statusBorder: Record<NodeExecutionStatus, string> = {
  IDLE: 'border-white/10',
  PENDING: 'border-white/20',
  RUNNING: 'border-cyan-500 animate-pulse',
  SUCCESS: 'border-green-500',
  FAILED: 'border-red-500',
  FALLBACK: 'border-yellow-500',
}

interface BaseNodeCardProps {
  label: string
  typeDotColor: string
  typeLabel: string
  status?: NodeExecutionStatus
  selected?: boolean
  sourceHandles?: Array<{ id: string; label?: string; position?: number }>
  targetHandles?: Array<{ id: string }>
  children?: React.ReactNode
}

export const BaseNodeCard = memo(function BaseNodeCard({
  label,
  typeDotColor,
  typeLabel,
  status = 'IDLE',
  selected,
  sourceHandles = [{ id: 'default' }],
  targetHandles = [{ id: 'default' }],
  children,
}: BaseNodeCardProps) {
  const border = statusBorder[status]

  return (
    <div
      className={cn(
        'bg-[#0a0a0a]/80 backdrop-blur-md border rounded-xl p-4 shadow-xl min-w-[180px] max-w-[220px]',
        'transition-colors duration-200',
        border,
        selected && 'ring-1 ring-indigo-500/50',
      )}
    >
      {/* Target handle(s) */}
      {targetHandles.map((h, i) => (
        <Handle
          key={h.id}
          type="target"
          id={h.id}
          position={Position.Left}
          style={{ top: `${((i + 1) / (targetHandles.length + 1)) * 100}%` }}
          className="!w-2 !h-2 !bg-white/30 !border-white/20 hover:!bg-white/60"
        />
      ))}

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('w-2 h-2 rounded-full shrink-0', typeDotColor)} />
        <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">{typeLabel}</span>
      </div>
      <p className="text-white text-sm font-medium truncate">{label}</p>

      {/* Extra content */}
      {children && <div className="mt-2">{children}</div>}

      {/* Source handle(s) */}
      {sourceHandles.map((h, i) => (
        <div key={h.id}>
          <Handle
            type="source"
            id={h.id}
            position={Position.Right}
            style={{ top: `${((i + 1) / (sourceHandles.length + 1)) * 100}%` }}
            className="!w-2 !h-2 !bg-white/30 !border-white/20 hover:!bg-white/60"
          />
          {h.label && (
            <span
              className="absolute right-4 text-[9px] text-white/30 font-mono"
              style={{ top: `${((i + 1) / (sourceHandles.length + 1)) * 100}%`, transform: 'translateY(-50%)' }}
            >
              {h.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
})
