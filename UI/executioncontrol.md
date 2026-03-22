# Execution Console — UI Spec

## Location

Resizable drawer panel. Default: bottom of canvas (h-64). Can be dragged to right side.

## Trigger

- Opens automatically when a workflow Run starts.
- Can be toggled with Cmd+` or a console icon button.

## Layout

┌─────────────────────────────────────────────────┐
│ [▼ Execution Console] Run #xyz ● RUNNING [X] │
├─────────────────────────────────────────────────┤
│ [GmailPoll ✓] [AIExtract ↻] [ToolSearch ...] │
├─────────────────────────────────────────────────┤
│ 12:03:01 [AIExtract] RUNNING │
│ 12:03:02 [AIExtract] Token: "Extracting ski..." │
│ 12:03:04 [AIExtract] SUCCESS → {skills: [...]} │
└─────────────────────────────────────────────────┘

text

## Styling

- Background: `bg-black/90 backdrop-blur-md border-t border-white/[0.08]`
- Log font: `font-mono text-xs text-white/70`
- Timestamps: `text-white/30`
- Node pills: colored by status (cyan=running, green=success, red=failed, yellow=fallback)
- Framer Motion: slide up from bottom on open, slide down on close

## Data Source

- GraphQL subscription: `nodeLogStream(runId, nodeId)`
- GraphQL subscription: `nodeExecutionUpdated(runId)`