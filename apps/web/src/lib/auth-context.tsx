'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth, onAuthStateChanged, type User } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

// DEV BYPASS: set NEXT_PUBLIC_DEV_BYPASS_AUTH=true to skip Firebase auth
const DEV_BYPASS = process.env['NEXT_PUBLIC_DEV_BYPASS_AUTH'] === 'true'
const DEV_MOCK_USER = {
  uid: 'dev-bypass-uid',
  email: 'dev@flowforge.local',
  displayName: 'Dev User',
  getIdToken: async () => 'dev-bypass-token',
} as unknown as User

export function FirebaseAuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(DEV_BYPASS ? DEV_MOCK_USER : null)
  const [loading, setLoading] = useState(!DEV_BYPASS)

  useEffect(() => {
    if (DEV_BYPASS) return
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
