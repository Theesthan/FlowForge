#!/bin/bash
# This script initializes the Prisma schema in the database
# It's safe to run multiple times (idempotent)

set -e

echo "Initializing database schema..."

# Wait for the database to be ready
for i in {1..30}; do
  if pg_isready -h postgres -U flowforge -d flowforge >/dev/null 2>&1; then
    echo "Database is ready"
    break
  fi
  echo "Waiting for database... ($i/30)"
  sleep 1
done

# Run Prisma db push to create schema
echo "Pushing Prisma schema..."
cd /app
/app/node_modules/.bin/prisma db push --skip-generate || true

echo "Database initialization complete"
