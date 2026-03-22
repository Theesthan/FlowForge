Command Palette — UI Spec

## Trigger

- `Cmd+K` (Mac) / `Ctrl+K` (Windows) anywhere in the canvas or dashboard.

## Layout

┌─────────────────────────────────┐
│ 🔍 Search commands... │
├─────────────────────────────────┤
│ WORKFLOW │
│ ▷ Run Workflow ⌘↵ │
│ ⏸ Pause Workflow │
│ ＋ Add Node ⌘N │
│ 💾 Save ⌘S │
├─────────────────────────────────┤
│ VIEW │
│ 📋 Toggle Console ⌘` │
│ 🗺 Toggle Minimap │
│ 🔲 Fit View ⌘⇧F │
├─────────────────────────────────┤
│ EXPORT │
│ ↓ Export as JSON │
│ ↓ Export as YAML │
│ 🔗 Copy Shareable Link │
└─────────────────────────────────┘

text

## Styling

- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Panel: `bg-[#0a0a0a] border border-white/10 rounded-2xl w-[560px] shadow-2xl`
- Input: `bg-transparent text-white placeholder:text-white/30 text-sm px-4 py-3 outline-none`
- Items: `px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white rounded-lg`
- Section headers: `text-white/20 text-xs uppercase tracking-widest px-4 pt-3 pb-1`
- Framer Motion: scale(0.95) + opacity(0) → scale(1) + opacity(1) on open

## Implementation

Use the `cmdk` npm package as the base, wrapped with Framer Motion for animation.