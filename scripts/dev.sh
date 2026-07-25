#!/bin/bash
# =============================================================================
# Enterprise Skills Hub - Local Dev Launcher
# =============================================================================
# Usage:
#   podman compose up -d      # Start all backend services
#   ./scripts/dev.sh           # Start the Next.js app
# =============================================================================

set -e
cd "$(dirname "$0")/.."

echo "Starting Enterprise Skills Hub..."
echo ""

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps --silent
fi

# Init DB if needed
npx prisma generate --quiet 2>/dev/null
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate 2>/dev/null

echo ""
echo "============================================="
echo "  Enterprise Skills Hub"
echo "============================================="
echo ""
echo "  App:             http://localhost:3000"
echo "  MinIO Console:   http://localhost:9001"
echo "  Prometheus:      http://localhost:9090"
echo "  Grafana:         http://localhost:3001"
echo ""
echo "  Login: alice@acme.com / password123"
echo "============================================="
echo ""

npm run dev
