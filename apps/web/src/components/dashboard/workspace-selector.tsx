'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Building2, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgSummary } from '@/hooks/use-workspace'

interface WorkspaceSelectorProps {
  orgs: OrgSummary[]
  activeOrg: OrgSummary | null
  onSelect: (orgId: string) => void
  onCreateOrg: (name: string) => Promise<void>
}

export function WorkspaceSelector({
  orgs,
  activeOrg,
  onSelect,
  onCreateOrg,
}: WorkspaceSelectorProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (): Promise<void> => {
    const name = newOrgName.trim()
    if (!name) return
    setSubmitting(true)
    await onCreateOrg(name)
    setNewOrgName('')
    setCreating(false)
    setSubmitting(false)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
          'bg-white/[0.03] border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.06]',
        )}
      >
        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
        <span className="max-w-[120px] truncate">{activeOrg?.name ?? 'Select workspace'}</span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-white/30 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full mt-1.5 z-50 w-56 bg-[#0a0a0a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Org list */}
              <div className="p-1.5">
                {orgs.length === 0 && !creating && (
                  <p className="text-white/30 text-xs px-3 py-2">No workspaces yet</p>
                )}
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      onSelect(org.id)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <Building2 className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <span className="flex-1 truncate">{org.name}</span>
                    {org.id === activeOrg?.id && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/[0.06] p-1.5">
                {creating ? (
                  <div className="px-2 py-1 flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Workspace name…"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleCreate()
                        if (e.key === 'Escape') {
                          setCreating(false)
                          setNewOrgName('')
                        }
                      }}
                      className="flex-1 bg-transparent text-white/80 text-xs placeholder:text-white/20 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreate()}
                      disabled={submitting || !newOrgName.trim()}
                      className="text-indigo-400 text-xs disabled:opacity-30"
                    >
                      {submitting ? '…' : 'Create'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New workspace
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
