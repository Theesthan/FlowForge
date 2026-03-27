import { initTracing } from '@flowforge/observability'
initTracing('api')

import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'

import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'

import { env } from '@flowforge/config'
import { resolvers } from './graphql/resolvers/index'
import { buildContext } from './middleware/auth'
import { logger } from './logger'
import { startRedisPubSubBridge } from './lib/redis-pubsub-bridge'
import { pubsub } from './graphql/resolvers/subscription'
import { registry, metricsMiddleware } from '@flowforge/observability'

const typeDefs = readFileSync(join(__dirname, 'graphql', 'schema.graphql'), 'utf-8')

const schema = makeExecutableSchema({ typeDefs, resolvers })

async function startServer(): Promise<void> {
  const app = express()
  const httpServer = createServer(app)

  app.use(metricsMiddleware('api'))
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType)
    res.end(await registry.metrics())
  })

  // ── WebSocket server for GraphQL subscriptions ──────────────────────────
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' })

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const token = ctx.connectionParams?.['Authorization'] as string | undefined
        if (token?.startsWith('Bearer ')) {
          // Lightweight context for subscriptions — userId extracted from token
          return { token: token.slice(7) }
        }
        return {}
      },
    },
    wsServer
  )

  // ── Apollo Server ────────────────────────────────────────────────────────
  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer(): Promise<void> {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await server.start()

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: env.CORS_ORIGIN, credentials: true }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => buildContext(req),
    })
  )

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway', ts: new Date().toISOString() })
  })

  // Start Redis → GraphQL PubSub bridge so Runtime events reach WS subscribers
  startRedisPubSubBridge(env.REDIS_URL, pubsub)

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 API Gateway  → http://localhost:${env.PORT}/graphql`)
    logger.info(`🔌 Subscriptions→ ws://localhost:${env.PORT}/graphql`)
  })
}

startServer().catch((err: unknown) => {
  logger.error({ err }, 'Failed to start API server')
  process.exit(1)
})
