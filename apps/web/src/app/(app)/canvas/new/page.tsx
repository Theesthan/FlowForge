'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { nanoid } from 'nanoid'
import { CREATE_WORKFLOW } from '@/hooks/use-workflow'
import { TEMPLATES } from '@/lib/templates'

export default function NewCanvasPage(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createWorkflow] = useMutation(CREATE_WORKFLOW)

  useEffect(() => {
    const templateId = searchParams.get('template')
    const template = TEMPLATES.find((t) => t.id === templateId)

    const orgId =
      searchParams.get('orgId') ??
      (typeof window !== 'undefined' ? (localStorage.getItem('ff_active_org_id') ?? '') : '')
    void createWorkflow({
      variables: {
        input: {
          name: template ? template.name : 'Untitled Workflow',
          orgId,
          definition: template ? JSON.stringify(template.definition) : JSON.stringify({ nodes: [], edges: [] }),
        },
      },
    }).then((res) => {
      const id = (res.data as { createWorkflow?: { id?: string } })?.createWorkflow?.id
      if (id) {
        router.replace(`/canvas/${id}`)
      } else {
        // fallback: use a local ID so the canvas still loads
        router.replace(`/canvas/${nanoid(8)}`)
      }
    }).catch(() => {
      router.replace(`/canvas/${nanoid(8)}`)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white/30 text-sm font-mono animate-pulse">Creating workflow…</div>
    </div>
  )
}
