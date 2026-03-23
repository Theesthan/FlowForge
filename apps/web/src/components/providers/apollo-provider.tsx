'use client'

import { ApolloProvider } from '@apollo/client'
import { getApolloClient } from '@/lib/apollo'
import type { ReactNode } from 'react'

interface ApolloWrapperProps {
  children: ReactNode
}

export default function ApolloWrapper({ children }: ApolloWrapperProps): JSX.Element {
  return <ApolloProvider client={getApolloClient()}>{children}</ApolloProvider>
}
