#!/usr/bin/env sh
# Enterprise Skills Hub CLI wrapper
# This script finds tsx and runs the CLI entry point
# It works both in development (local node_modules) and when installed globally

# Resolve the directory of this script (follows symlinks)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Try to find tsx: first in local node_modules, then globally
TSX=""
if [ -x "$SCRIPT_DIR/../node_modules/.bin/tsx" ]; then
  TSX="$SCRIPT_DIR/../node_modules/.bin/tsx"
elif command -v tsx >/dev/null 2>&1; then
  TSX="tsx"
elif command -v npx >/dev/null 2>&1; then
  TSX="npx tsx"
else
  echo "Error: tsx is required but not found." >&2
  echo "Install it with: npm install -g tsx" >&2
  exit 1
fi

exec $TSX "$SCRIPT_DIR/index.ts" "$@"
