#!/bin/sh
set -e

# Start the Runtime server
cd /app/services/runtime && exec pnpm dev
