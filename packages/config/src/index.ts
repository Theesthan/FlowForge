import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'
import { resolve } from 'path'

// Load .env from the monorepo root when running locally
loadDotenv({ path: resolve(process.cwd(), '.env') })
loadDotenv({ path: resolve(process.cwd(), '.env.local'), override: true })

// ============================================================
// Schema: validates all required environment variables at startup
// ============================================================
const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // Groq
  GROQ_API_KEY: z.string().min(1),

  // App
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Service URLs (used by API gateway to call downstream services)
  ORCHESTRATOR_URL: z.string().url().default('http://localhost:4001'),
  RUNTIME_URL: z.string().url().default('http://localhost:4002'),

  // Tool integrations (optional in development)
  NOTION_API_KEY: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
})

// ============================================================
// Parse & export — throws at startup if required vars are missing
// ============================================================
function parseEnv(): z.infer<typeof envSchema> {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(`❌ Invalid environment variables:\n${missing}`)
  }

  return result.data
}

export const env = parseEnv()

export type Env = z.infer<typeof envSchema>
