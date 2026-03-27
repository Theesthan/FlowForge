#!/bin/sh
set -e

# Start the Orchestrator server
cd /app/services/orchestrator && exec pnpm dev
