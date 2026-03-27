#!/bin/sh
set -e

# Start the Next.js web server
cd /app/apps/web && exec pnpm dev
