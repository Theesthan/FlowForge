'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Edit3 } from 'lucide-react'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'

interface HumanGateDialogProps {
  open: boolean
  nodeLabel: string
  prompt: string
  aiRecommendation?: string
  onApprove: (editedOutput?: string) => void
  onReject: () => void
}

export function HumanGateDialog({
  open,
  nodeLabel,
  prompt,
  aiRecommendation,
  onApprove,
  onReject,
}: HumanGateDialogProps): JSX.Element {
  const [editing, setEditing] = useState(false)
  const [editedOutput, setEditedOutput] = useState(aiRecommendation ?? '')

  const handleApprove = (): void => {
    onApprove(editing ? editedOutput : undefined)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg bg-[#0a0a0a]/95 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <h2 className="text-white font-semibold text-sm">{nodeLabel}</h2>
                <span className="ml-auto text-white/30 text-xs">Human Gate — Action Required</span>
              </div>

              {/* Prompt */}
              <p className="text-white/70 text-sm mb-4 leading-relaxed">{prompt}</p>

              {/* AI Recommendation */}
              {aiRecommendation && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/40 text-xs">AI Recommendation</span>
                    <button
                      type="button"
                      onClick={() => setEditing((e) => !e)}
                      className="flex items-center gap-1 text-white/40 hover:text-white/70 text-xs transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      {editing ? 'Cancel edit' : 'Edit'}
                    </button>
                  </div>
                  {editing ? (
                    <textarea
                      value={editedOutput}
                      onChange={(e) => setEditedOutput(e.target.value)}
                      rows={5}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/70 focus:outline-none focus:border-white/20 resize-none"
                    />
                  ) : (
                    <pre className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/60 overflow-auto max-h-32">
                      {aiRecommendation}
                    </pre>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={onReject}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-rose-400 text-sm hover:bg-rose-500/10 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <HoverBorderGradient
                  as="button"
                  type="button"
                  onClick={handleApprove}
                  containerClassName="rounded-lg"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  {editing ? 'Approve with edits' : 'Approve'}
                </HoverBorderGradient>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
