import { Cpu, GitBranch, Zap, RefreshCw, Users, Code2 } from 'lucide-react'

interface FeatureItemProps {
  icon: React.ReactNode
  name: string
  description: string
}

function FeatureItem({ icon, name, description }: FeatureItemProps): JSX.Element {
  return (
    <div className="group flex items-start gap-3 transition-all duration-300 hover:scale-105">
      <div className="relative mt-0.5">
        <div className="w-2 h-2 bg-white rounded-full group-hover:animate-pulse" />
        <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="relative">
        <div className="font-medium text-white group-hover:text-white transition-colors duration-300">
          {name}
        </div>
        <div className="text-white/50 text-sm group-hover:text-white/70 transition-colors duration-300">
          {description}
        </div>
        <div className="absolute -inset-2 bg-white/5 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      </div>
    </div>
  )
}

export function FeatureStrip(): JSX.Element {
  const features = [
    { icon: <GitBranch className="w-4 h-4" />, name: 'Visual DAG Editor', description: 'Drag-and-drop workflow canvas with React Flow' },
    { icon: <Cpu className="w-4 h-4" />, name: 'Custom FSM Runtime', description: 'Built-from-scratch state machine, no vendor lock-in' },
    { icon: <Zap className="w-4 h-4" />, name: 'Real-time Execution', description: 'Live node state via GraphQL subscriptions' },
    { icon: <RefreshCw className="w-4 h-4" />, name: 'Retry + Fallback', description: 'Exponential backoff with configurable fallback outputs' },
    { icon: <Users className="w-4 h-4" />, name: 'Human-in-the-Loop', description: 'Pause and resume workflows at any human gate node' },
    { icon: <Code2 className="w-4 h-4" />, name: 'Groq LLM Nodes', description: 'llama-3.3-70b-versatile for every AI node' },
  ]

  return (
    <div className="w-full py-24 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <FeatureItem key={f.name} icon={f.icon} name={f.name} description={f.description} />
        ))}
      </div>
    </div>
  )
}
