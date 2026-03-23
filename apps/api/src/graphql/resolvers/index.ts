import { JSONScalar } from './scalars'
import { queryResolvers } from './query'
import { mutationResolvers } from './mutation'
import { subscriptionResolvers } from './subscription'

export const resolvers = {
  JSON: JSONScalar,
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...subscriptionResolvers,
}
