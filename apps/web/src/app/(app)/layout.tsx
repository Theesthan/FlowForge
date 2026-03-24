'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function AppLayout({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) return <div className="min-h-screen bg-black" />
  if (!user) return <div className="min-h-screen bg-black" />
  return <>{children}</>
}
