'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_TYPE_META } from './nodes'

interface NodePaletteProps {
  onAddNode: (type: string) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)

  const onDragStart = (e: React.DragEvent, type: string): void => {
    e.dataTransfer.setData('application/reactflow', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl w-48"
          >
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-3 px-1">
              Nodes
            </p>
            <div className="space-y-1">
              {NODE_TYPE_META.map((meta) => (
                <div
                  key={meta.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, meta.type)}
                  onClick={() => onAddNode(meta.type)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/[0.05] transition-colors group"
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', meta.dotColor)} />
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs font-medium group-hover:text-white transition-colors truncate">
                      {meta.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0a0a0a]/90 border border-white/10 text-white/40 hover:text-white/70 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  )
}
