import Link from 'next/link'
import { HeroGeometric } from '@/components/ui/hero-geometric'
import { TextRevealByWord } from '@/components/ui/text-reveal-by-word'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { FeatureStrip } from '@/components/landing/feature-strip'

export default function LandingPage(): JSX.Element {
  return (
    <main className="bg-[#030303] min-h-screen">
      {/* Hero */}
      <section className="relative">
        <HeroGeometric
          badge="FlowForge AI"
          title1="Autonomous Agent"
          title2="Workflows, Visualized."
        />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-4 z-20">
          <Link href="/dashboard">
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="px-6 py-2 text-sm font-medium"
            >
              Start Building Free
            </HoverBorderGradient>
          </Link>
          <Link href="/login">
            <HoverBorderGradient
              containerClassName="rounded-full"
              className="px-6 py-2 text-sm font-medium text-white/70"
            >
              Sign In
            </HoverBorderGradient>
          </Link>
        </div>
      </section>

      {/* Text Reveal */}
      <section className="bg-[#030303]">
        <TextRevealByWord text="FlowForge transforms static automations into intelligent, adaptive systems where AI agents collaborate autonomously." />
      </section>

      {/* Features */}
      <section className="bg-[#030303]">
        <FeatureStrip />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/30 text-sm font-mono">FlowForge · PSG College of Technology</span>
          <div className="flex items-center gap-6 text-white/30 text-sm">
            <Link href="/login" className="hover:text-white/60 transition-colors">
              Login
            </Link>
            <a
              href="https://github.com/Theesthan/FlowForge"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
