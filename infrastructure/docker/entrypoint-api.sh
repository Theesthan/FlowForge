#!/bin/sh
set -e

# Start the API server
cd /app/apps/api && exec pnpm dev
