import admin from 'firebase-admin'
import type { Request } from 'express'
import type { GraphQLContext } from '@flowforge/types'
import { env } from '@flowforge/config'
import { logger } from '../logger'

// Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Env stores the key with literal \n — replace for proper PEM format
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

export async function buildContext(req: Request): Promise<GraphQLContext> {
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
