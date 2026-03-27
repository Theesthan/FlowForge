#!/bin/sh
set -e

# Start the Worker
cd /app/services/worker && exec pnpm dev
