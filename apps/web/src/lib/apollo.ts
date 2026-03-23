'use client'

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  type NormalizedCacheObject,
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const HTTP_URL =
  process.env['NEXT_PUBLIC_GRAPHQL_HTTP_URL'] ?? 'http://localhost:4000/graphql'
const WS_URL =
  process.env['NEXT_PUBLIC_GRAPHQL_WS_URL'] ?? 'ws://localhost:4000/graphql'

function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  const httpLink = createHttpLink({
    uri: HTTP_URL,
    credentials: 'include',
  })

  // WebSocket link is only created in the browser (not during SSR)
  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: WS_URL,
            connectionParams: (): Record<string, string> => {
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

  // Route subscriptions over WebSocket, everything else over HTTP
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
          httpLink
        )
      : httpLink

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
