'use client'

import { useRouter } from 'next/navigation'
import { Plus, Workflow, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { signOut } from '@/lib/firebase'
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import DotOrbitBackground from '@/components/ui/dot-orbit'
import FloatingActionMenu from '@/components/ui/floating-action-menu'
import { TemplateCard } from '@/components/dashboard/template-card'
import { WorkflowCard } from '@/components/dashboard/workflow-card'
import { WorkspaceSelector } from '@/components/dashboard/workspace-selector'
import { TEMPLATES } from '@/lib/templates'
import { useWorkspace } from '@/hooks/use-workspace'

export default function DashboardPage(): JSX.Element {
  const { user } = useAuth()
  const router = useRouter()
  const { orgs, activeOrg, activeOrgId, setActiveOrgId, workflows, workflowsLoading, createOrg } =
    useWorkspace()

  const handleSignOut = async (): Promise<void> => {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <DotOrbitBackground />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">FlowForge</h1>
              <p className="text-white/30 text-sm mt-0.5">{user?.email ?? 'Welcome back'}</p>
            </div>
            <WorkspaceSelector
              orgs={orgs}
              activeOrg={activeOrg}
              onSelect={setActiveOrgId}
              onCreateOrg={async (name) => {
                await createOrg(name)
              }}
            />
          </div>
          <HoverBorderGradient
            as="button"
            type="button"
            onClick={() =>
              router.push(activeOrgId ? `/canvas/new?orgId=${activeOrgId}` : '/canvas/new')
            }
            containerClassName="rounded-full"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </HoverBorderGradient>
        </div>

        {/* My Workflows */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="w-4 h-4 text-white/40" />
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-widest">
              {activeOrg ? `${activeOrg.name} — Workflows` : 'My Workflows'}
            </h2>
          </div>

          {workflowsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse"
                />
              ))}
            </div>
          ) : workflows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  id={wf.id}
                  name={wf.name}
                  description={wf.description ?? undefined}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <Workflow className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-white/30 text-sm">No workflows yet.</p>
              <p className="text-white/20 text-xs mt-1">
                Create one from scratch or use a template below.
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(activeOrgId ? `/canvas/new?orgId=${activeOrgId}` : '/canvas/new')
                }
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                + Create your first workflow
              </button>
            </div>
          )}
        </section>

        {/* Template Gallery */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-widest">
              Template Gallery
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        options={[
          {
            label: 'Workspace',
            Icon: <Workflow className="w-4 h-4" />,
            onClick: () => router.push('/dashboard'),
          },
          {
            label: 'Settings',
            Icon: <Settings className="w-4 h-4" />,
            onClick: () => router.push('/dashboard'),
          },
          {
            label: 'Logout',
            Icon: <LogOut className="w-4 h-4" />,
            onClick: handleSignOut,
          },
        ]}
      />
    </div>
  )
}
