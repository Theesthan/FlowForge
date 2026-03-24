'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'

export interface CommandPaletteAction {
  id: string
  label: string
  shortcut?: string
  onSelect: () => void
}

interface CommandPaletteProps {
  workflowActions?: CommandPaletteAction[]
  viewActions?: CommandPaletteAction[]
  exportActions?: CommandPaletteAction[]
}

export function CommandPalette({
  workflowActions = [],
  viewActions = [],
  exportActions = [],
}: CommandPaletteProps): JSX.Element {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-[560px] shadow-2xl overflow-hidden"
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
            >
              <div className="flex items-center border-b border-white/10 px-4">
                <Search className="w-4 h-4 text-white/30 shrink-0" />
                <Command.Input
                  className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm px-3 py-3 outline-none"
                  placeholder="Search commands…"
                />
              </div>
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-white/30">
                  No results found.
                </Command.Empty>

                {workflowActions.length > 0 && (
                  <Command.Group
                    heading="Workflow"
                    className="[&_[cmdk-group-heading]]:text-white/20 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1"
                  >
                    {workflowActions.map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.label}
                        onSelect={() => { action.onSelect(); setOpen(false) }}
                        className="flex items-center justify-between px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg cursor-pointer data-[selected]:bg-white/[0.05] data-[selected]:text-white"
                      >
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <kbd className="text-white/30 text-xs">{action.shortcut}</kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {viewActions.length > 0 && (
                  <Command.Group
                    heading="View"
                    className="[&_[cmdk-group-heading]]:text-white/20 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1"
                  >
                    {viewActions.map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.label}
                        onSelect={() => { action.onSelect(); setOpen(false) }}
                        className="flex items-center justify-between px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg cursor-pointer data-[selected]:bg-white/[0.05] data-[selected]:text-white"
                      >
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <kbd className="text-white/30 text-xs">{action.shortcut}</kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {exportActions.length > 0 && (
                  <Command.Group
                    heading="Export"
                    className="[&_[cmdk-group-heading]]:text-white/20 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1"
                  >
                    {exportActions.map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.label}
                        onSelect={() => { action.onSelect(); setOpen(false) }}
                        className="flex items-center justify-between px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg cursor-pointer data-[selected]:bg-white/[0.05] data-[selected]:text-white"
                      >
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <kbd className="text-white/30 text-xs">{action.shortcut}</kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
