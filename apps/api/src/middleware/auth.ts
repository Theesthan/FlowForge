import admin from 'firebase-admin'
import type { Request } from 'express'
import type { GraphQLContext } from '@flowforge/types'
import { env } from '@flowforge/config'
import { logger } from '../logger'
import { prisma } from '@flowforge/db'

const DEV_BYPASS_TOKEN = 'dev-bypass-token'
const DEV_BYPASS_UID = 'dev-bypass-uid'
const DEV_BYPASS_EMAIL = 'dev@flowforge.local'

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
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return {}
  }

  const token = authHeader.slice(7)

  // Dev bypass: accept the mock token in non-production environments
  if (process.env.NODE_ENV !== 'production' && token === DEV_BYPASS_TOKEN) {
    // Upsert dev user so resolvers that look up by firebaseUid always find one
    await prisma.user.upsert({
      where: { firebaseUid: DEV_BYPASS_UID },
      update: {},
      create: { firebaseUid: DEV_BYPASS_UID, email: DEV_BYPASS_EMAIL, displayName: 'Dev User' },
    })
    return { token, userId: DEV_BYPASS_UID }
  }

  if (!firebaseReady) return {}

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
