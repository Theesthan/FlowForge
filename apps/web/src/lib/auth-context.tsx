'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { auth, onAuthStateChanged, type User } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function FirebaseAuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
