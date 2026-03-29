'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react'
import { useSubscription } from '@apollo/client'
import { NODE_LOG_STREAM, type NodeExecutionEvent, type LogToken } from '@/hooks/use-workflow-run'

interface LogLine {
  nodeId: string
  nodeLabel: string
  text: string
  timestamp: string
  type: 'log' | 'status'
  status?: NodeExecutionEvent['status']
}

interface ExecutionConsoleProps {
  runId: string | null
  nodeExecutions: NodeExecutionEvent[]
  nodeLabels: Record<string, string>
  activeNodeId: string | null
}

function NodeLogFeed({
  runId,
  nodeId,
  onToken,
}: {
  runId: string
  nodeId: string
  onToken: (token: LogToken) => void
}): null {
  useSubscription(NODE_LOG_STREAM, {
    variables: { runId, nodeId },
    onData: ({ data }) => {
      const token = data.data?.nodeLogStream as LogToken | undefined
      if (token) onToken(token)
    },
  })
  return null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-white/40',
  RUNNING: 'text-cyan-400',
  SUCCESS: 'text-green-400',
  FAILED: 'text-red-400',
  FALLBACK: 'text-yellow-400',
}

export function ExecutionConsole({
  runId,
  nodeExecutions,
  nodeLabels,
  activeNodeId,
}: ExecutionConsoleProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<LogLine[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  // Track logged (nodeId, status, retries) combos to prevent duplicates
  const loggedKeys = useRef<Set<string>>(new Set())

  // Append status lines only for new/changed statuses
  useEffect(() => {
    if (!nodeExecutions.length) return
    for (const exec of nodeExecutions) {
      const key = `${exec.nodeId}:${exec.status}:${exec.retries}`
      if (loggedKeys.current.has(key)) continue
      loggedKeys.current.add(key)
      const label = nodeLabels[exec.nodeId] ?? exec.nodeId
      setLines((prev) => [
        ...prev,
        {
          nodeId: exec.nodeId,
          nodeLabel: label,
          text: `[${label}] → ${exec.status}${exec.retries > 0 ? ` (retry ${exec.retries})` : ''}`,
          timestamp: exec.startedAt,
          type: 'status',
          status: exec.status,
        },
      ])
      if (exec.status === 'RUNNING') setOpen(true)
    }
  }, [nodeExecutions, nodeLabels])

  const handleToken = (nodeId: string, token: LogToken): void => {
    const label = nodeLabels[nodeId] ?? nodeId
    setLines((prev) => {
      // Append token to last line for same node, or create new
      const last = prev[prev.length - 1]
      if (last?.nodeId === nodeId && last.type === 'log') {
        return [
          ...prev.slice(0, -1),
          { ...last, text: last.text + token.token },
        ]
      }
      return [
        ...prev,
        { nodeId, nodeLabel: label, text: token.token, timestamp: token.timestamp, type: 'log' },
      ]
    })
  }

  // Auto-scroll
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, open])

  return (
    <>
      {/* Subscribe to logs for active node */}
      {runId && activeNodeId && (
        <NodeLogFeed
          runId={runId}
          nodeId={activeNodeId}
          onToken={(token) => handleToken(activeNodeId, token)}
        />
      )}

      {/* Console drawer */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        {/* Toggle bar */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-4 py-2 bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/10 text-white/50 text-xs hover:text-white/80 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-mono">Execution Console</span>
          {runId && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          <span className="ml-auto">{open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 280, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#050505]/95 backdrop-blur-md border-t border-white/10 overflow-hidden"
            >
              <div className="h-full overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
                {lines.length === 0 ? (
                  <p className="text-white/20">Run a workflow to see execution logs here.</p>
                ) : (
                  lines.map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-white/20 shrink-0 w-[80px] truncate">
                        {line.timestamp
                          ? (() => {
                              const d = new Date(
                                /^\d+$/.test(line.timestamp) ? Number(line.timestamp) : line.timestamp,
                              )
                              return isNaN(d.getTime())
                                ? '--:--:--'
                                : d.toLocaleTimeString('en', { hour12: false })
                            })()
                          : '--:--:--'}
                      </span>
                      <span className={line.type === 'status' ? (STATUS_COLORS[line.status ?? ''] ?? 'text-white/60') : 'text-white/70'}>
                        {line.text}
                      </span>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
