import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FlowForge',
    template: '%s · FlowForge',
  },
  description: 'Autonomous AI Agent Workflow Builder — visual DAG editor with custom FSM runtime.',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-white antialiased">{children}</body>
    </html>
  )
}
