export default function HomePage(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      {/* Status dot */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-mono text-white/60">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        Pre-alpha · Scaffolding complete
      </div>

      {/* Wordmark */}
      <h1 className="text-6xl font-medium tracking-[-0.04em] text-white sm:text-8xl">
        FlowForge
      </h1>

      <p className="mt-4 max-w-md text-center font-mono text-sm text-white/40">
        Autonomous AI Agent Workflows, Visualized.
      </p>

      {/* Stack badges */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {[
          'React Flow',
          'Apollo GraphQL',
          'Groq LLM',
          'Custom FSM',
          'pgvector',
          'BullMQ',
        ].map((label) => (
          <span
            key={label}
            className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-xs text-white/50"
          >
            {label}
          </span>
        ))}
      </div>
    </main>
  )
}
