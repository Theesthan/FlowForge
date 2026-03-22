
### `.claude/commands/prisma-model.md`
```markdown
# Prisma Model + Migration Builder

When asked to add a new Prisma model, follow this exact workflow:

## Steps
1. Add the model to `packages/db/prisma/schema.prisma`:

```prisma
model <ModelName> {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // fields here

  @@map("<table_name>")
}
Rules to follow:

Always use cuid() for IDs, never autoincrement().

Soft deletes → add deletedAt DateTime? field.

pgvector columns → embedding Unsupported("vector(1536)")?.

Always add @@map() with snake_case table name.

Run migration:

bash
cd packages/db
npx prisma migrate dev --name <migration_name>
npx prisma generate
Export the new type from:

packages/db/src/index.ts

Update:

packages/types/src/db.ts with the TypeScript interface.

Never
Never run prisma migrate reset in production.

Never edit migration files after they've been committed.

Never use prisma db push in production (dev only).