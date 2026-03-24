'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { cn } from '@/lib/utils'

interface PanelBaseProps {
  open: boolean
  title: string
  typeDotColor: string
  onClose: () => void
  onSave: () => void
  children: ReactNode
  dirty?: boolean
}

export function PanelBase({
  open,
  title,
  typeDotColor,
  onClose,
  onSave,
  children,
  dirty = false,
}: PanelBaseProps): JSX.Element {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 380 }}
          animate={{ x: 0 }}
          exit={{ x: 380 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 h-full w-[380px] bg-[#080808] border-l border-white/[0.08] z-30 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full shrink-0', typeDotColor)} />
              <span className="text-white font-medium text-sm">{title}</span>
              {dirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" title="Unsaved changes" />
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {children}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/[0.08]">
            <HoverBorderGradient
              as="button"
              type="button"
              onClick={onSave}
              containerClassName="w-full rounded-xl"
              className="w-full py-2 text-sm font-medium"
            >
              Save Changes
            </HoverBorderGradient>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Reusable section header
export function ConfigSection({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="space-y-2">
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">{title}</p>
      {children}
    </div>
  )
}
