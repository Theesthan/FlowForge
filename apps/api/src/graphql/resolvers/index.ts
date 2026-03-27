import type { IResolvers } from '@graphql-tools/utils'
import { JSONScalar } from './scalars'
import { queryResolvers } from './query'
import { mutationResolvers } from './mutation'
import { subscriptionResolvers } from './subscription'

// IResolvers satisfies makeExecutableSchema; Record<string, unknown> on each
// module breaks the Prisma type inference chain (TS2742)
export const resolvers: IResolvers = {
  JSON: JSONScalar,
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...subscriptionResolvers,
}
