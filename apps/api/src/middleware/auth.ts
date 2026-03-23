import admin from 'firebase-admin'
import type { Request } from 'express'
import type { GraphQLContext } from '@flowforge/types'
import { env } from '@flowforge/config'
import { logger } from '../logger'

// Initialize Firebase Admin SDK once
let firebaseReady = false

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        // Env stores the key with literal \n — replace for proper PEM format
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
    firebaseReady = true
  } catch (err) {
    logger.warn(
      { err },
      '⚠️  Firebase Admin SDK failed to initialise — auth is DISABLED. ' +
        'Set a valid FIREBASE_PRIVATE_KEY (PEM format) in your .env to enable it.',
    )
  }
}

export async function buildContext(req: Request): Promise<GraphQLContext> {
  if (!firebaseReady) return {}

  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return {}
  }

  const token = authHeader.slice(7)

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    return {
      token,
      userId: decoded.uid,
    }
  } catch (err) {
    logger.warn({ err }, 'Invalid Firebase token')
    return {}
  }
}
