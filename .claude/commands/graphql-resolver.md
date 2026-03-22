
### `.claude/commands/graphql-resolver.md`
```markdown
# GraphQL Resolver + Subscription Builder

When asked to build a new GraphQL resolver, follow this pattern:

## Steps
1. Add the type/query/mutation/subscription to `apps/api/src/graphql/schema.graphql`
2. Create resolver at `apps/api/src/graphql/resolvers/<domain>.resolver.ts`:

```typescript
import { Context } from '../types/context';
import { requireRole } from '../middleware/rbac';

export const <Domain>Resolvers = {
  Query: {
    get<Entity>: async (_: unknown, args: { id: string }, ctx: Context) => {
      requireRole(ctx, ['OWNER', 'EDITOR', 'VIEWER']);
      // implementation
    }
  },
  Mutation: {
    create<Entity>: async (_: unknown, args: Create<Entity>Input, ctx: Context) => {
      requireRole(ctx, ['OWNER', 'EDITOR']);
      // implementation
    }
  },
  Subscription: {
    <entity>Updated: {
      subscribe: (_: unknown, args: { id: string }, ctx: Context) => {
        // return Redis pub/sub async iterator
      }
    }
  }
};
Register in:

apps/api/src/graphql/resolvers/index.ts

Add input validation with Zod before DB calls.

Always pass Firebase UID from ctx.user.uid — never trust client-sent user IDs.

Auth Rules
Always call requireRole(ctx, [...]) at the top of every resolver.

Viewer = read only, Editor = read + write, Owner = all + delete.