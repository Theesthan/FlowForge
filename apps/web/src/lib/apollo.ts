'use client'

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  type NormalizedCacheObject,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { getIdToken } from './firebase'

const HTTP_URL =
  process.env['NEXT_PUBLIC_GRAPHQL_HTTP_URL'] ?? 'http://localhost:4000/graphql'
const WS_URL =
  process.env['NEXT_PUBLIC_GRAPHQL_WS_URL'] ?? 'ws://localhost:4000/graphql'

function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  const httpLink = createHttpLink({
    uri: HTTP_URL,
    credentials: 'include',
  })

  // Attach a fresh Firebase ID token to every HTTP request
  const authLink = setContext(async (_, { headers }: { headers?: Record<string, string> }) => {
    const token = await getIdToken()
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  })

  // WebSocket link is only created in the browser (not during SSR)
  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: WS_URL,
            connectionParams: (): Record<string, string> => {
              // In dev bypass mode, use the bypass token directly
              if (process.env['NEXT_PUBLIC_DEV_BYPASS_AUTH'] === 'true') {
                return { Authorization: 'Bearer dev-bypass-token' }
              }
              // Auth token injected at connection time from localStorage
              const token =
                typeof window !== 'undefined'
                  ? (localStorage.getItem('ff_token') ?? '')
                  : ''
              return token ? { Authorization: `Bearer ${token}` } : {}
            },
          })
        )
      : null

  // Route subscriptions over WebSocket, everything else over HTTP (with auth)
  const splitLink =
    wsLink !== null
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query)
            return (
              definition.kind === 'OperationDefinition' &&
              definition.operation === 'subscription'
            )
          },
          wsLink,
          authLink.concat(httpLink)
        )
      : authLink.concat(httpLink)

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  })
}

// Singleton — reused across the client lifecycle
let apolloClientSingleton: ApolloClient<NormalizedCacheObject> | undefined

export function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (!apolloClientSingleton) {
    apolloClientSingleton = createApolloClient()
  }
  return apolloClientSingleton
}
