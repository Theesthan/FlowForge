# Template Card — UI Spec

## Usage

Template gallery page and "New Workflow" modal.

## Card Structure

```tsx
<div
  className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 cursor-pointer
             hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
>
  <div
    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity
               bg-gradient-to-br from-indigo-500/5 to-cyan-500/5"
  />

  <div
    className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20
               flex items-center justify-center mb-4"
  >
    <Icon className="text-indigo-400 w-5 h-5" />
  </div>

  <h3 className="text-white font-semibold text-sm mb-1">{template.name}</h3>
  <p className="text-white/50 text-xs leading-relaxed mb-4">
    {template.description}
  </p>

  <span className="text-white/30 text-xs">
    {template.nodeCount} nodes
  </span>

  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
    <HoverBorderGradient>Use Template</HoverBorderGradient>
  </div>
</div>
Templates + Icons
PSG Internship Hunter → BriefcaseIcon (indigo)

Research Automation → FlaskIcon (cyan)

Lead Qualification → TargetIcon (rose)

Content Pipeline → RssIcon (orange)