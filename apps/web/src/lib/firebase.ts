'use client'

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: process.env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: process.env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: process.env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: process.env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: process.env['NEXT_PUBLIC_FIREBASE_APP_ID'],
}

// Prevent duplicate initializations (Next.js hot-reload safe)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!

export const auth: Auth = getAuth(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/**
 * Sign in with Google popup and store the ID token in localStorage
 * so Apollo Client can attach it to WebSocket connection params.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  const token = await result.user.getIdToken()
  localStorage.setItem('ff_token', token)
  return result.user
}

export async function signOut(): Promise<void> {
  localStorage.removeItem('ff_token')
  await firebaseSignOut(auth)
}

/**
 * Returns a fresh ID token for authenticated HTTP requests.
 * Firebase automatically refreshes tokens transparently.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export { onAuthStateChanged }
export type { User }
