#!/usr/bin/env bash
set -euo pipefail

echo "Starting local infrastructure..."
docker compose up -d

echo "Starting FloWiser frontend and backend..."
npm run dev
