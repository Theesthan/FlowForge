# Node Config Panel — UI Spec

## Location

Right side panel. Width: 380px. Slides in from the right when a node is selected on canvas.

## Layout

┌─────────────────────┐
│ ● AI Node [×] │
│ Name: [input] │
├─────────────────────┤
│ CONFIGURATION │
│ │
│ System Prompt: │
│ [textarea] │
│ │
│ Input Mapping: │
│ [key-value editor] │
│ │
│ Output Schema: │
│ [JSON editor] │
├─────────────────────┤
│ FAILURE POLICY │
│ Retries: [0-3] │
│ Hard Fail: [toggle] │
│ Fallback: [input] │
├─────────────────────┤
│ [Save Changes] │
└─────────────────────┘

text

## Styling

- Background: `bg-[#080808] border-l border-white/[0.08]`
- Section headers: `text-white/40 text-xs uppercase tracking-widest`
- Inputs: Shadcn `Input` with dark theme overrides
- Textareas: `bg-white/[0.03] border border-white/10 rounded-lg font-mono text-sm`
- Save button: `HoverBorderGradient` component

## Behavior

- Opens on node click, closes on canvas click or [×].
- Framer Motion: slide in from right (x: 380 → 0).
- Changes are applied to canvas state immediately on Save.
- Unsaved changes show a yellow dot indicator on the panel header.