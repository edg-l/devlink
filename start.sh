#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Configuration (override via environment or .env file)
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-4800}"
export ORIGIN="${ORIGIN:-http://localhost:$PORT}"

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Build if needed (no build dir or source is newer)
if [ ! -d build ] || [ "$(find src -newer build/index.js -print -quit 2>/dev/null)" ]; then
  echo "Building..."
  npm run build
fi

echo "Starting devlink on $HOST:$PORT"
exec node build
