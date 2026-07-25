#!/bin/bash
# =============================================================================
# Enterprise Skills Hub - Local Development Launcher
# =============================================================================
# Starts infrastructure in Podman, then launches Next.js app natively.
#
# Prerequisites:
#   - Podman installed (brew install podman)
#   - Podman machine running (podman machine start)
#   - Node.js 20+ installed
#
# Usage:
#   ./scripts/dev.sh          # Start everything
#   ./scripts/dev.sh --infra  # Only start infrastructure
#   ./scripts/dev.sh --app    # Only start app (infra must be running)
#   ./scripts/dev.sh --stop   # Stop infrastructure
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/podman-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[dev]${NC} $1"; }
ok() { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1"; }

# Detect compose command (podman compose or docker compose)
detect_compose() {
  if command -v podman &>/dev/null && podman compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
    ok "Using Podman Compose"
  elif command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    ok "Using Docker Compose"
  elif command -v podman-compose &>/dev/null; then
    COMPOSE_CMD="podman-compose"
    ok "Using podman-compose"
  else
    err "No compose runtime found. Install Podman or Docker."
    echo "  Podman:  brew install podman && podman machine init && podman machine start"
    echo "  Docker:  brew install --cask docker"
    exit 1
  fi
}

# Start infrastructure services
start_infra() {
  log "Starting infrastructure services..."
  cd "$PROJECT_DIR"
  $COMPOSE_CMD -f podman-compose.yml up -d

  log "Waiting for services to be ready..."

  # Wait for PostgreSQL
  local retries=0
  while ! nc -z localhost 5432 &>/dev/null 2>&1; do
    retries=$((retries + 1))
    if [ $retries -gt 30 ]; then
      err "PostgreSQL failed to start. Check: $COMPOSE_CMD -f podman-compose.yml logs postgres"
      exit 1
    fi
    sleep 1
  done
  ok "PostgreSQL ready (localhost:5432)"

  # Wait for Redis
  retries=0
  while ! nc -z localhost 6379 &>/dev/null 2>&1; do
    retries=$((retries + 1))
    if [ $retries -gt 30 ]; then
      err "Redis failed to start. Check: $COMPOSE_CMD -f podman-compose.yml logs redis"
      exit 1
    fi
    sleep 1
  done
  ok "Redis ready (localhost:6379)"

  # Wait for MinIO
  retries=0
  while ! curl -sf http://localhost:9000/minio/health/live &>/dev/null; do
    retries=$((retries + 1))
    if [ $retries -gt 30 ]; then
      warn "MinIO slow to start — continuing anyway"
      break
    fi
    sleep 1
  done
  ok "MinIO ready (localhost:9000, console: localhost:9001)"

  # Wait for Elasticsearch
  retries=0
  while ! curl -sf http://localhost:9200/_cluster/health &>/dev/null; do
    retries=$((retries + 1))
    if [ $retries -gt 30 ]; then
      warn "Elasticsearch slow to start — continuing anyway"
      break
    fi
    sleep 1
  done
  ok "Elasticsearch ready (localhost:9200)"

  # Prometheus & Grafana (non-blocking)
  sleep 3
  if curl -sf http://localhost:9090/-/healthy &>/dev/null; then
    ok "Prometheus ready (localhost:9090)"
  else
    warn "Prometheus not ready yet — check logs"
  fi

  if curl -sf http://localhost:3001/api/health &>/dev/null; then
    ok "Grafana ready (localhost:3001)"
  else
    warn "Grafana not ready yet — check logs"
  fi
}

# Initialize database
init_db() {
  log "Initializing database..."
  cd "$PROJECT_DIR"

  # Check if .env exists
  if [ ! -f .env ]; then
    cp .env.example .env
    ok "Created .env from .env.example"
  fi

  # Generate Prisma client
  npx prisma generate --quiet

  # Push schema
  npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate

  ok "Database schema pushed"

  # Seed (only if empty)
  local skill_count
  skill_count=$(podman exec skills-hub-postgres psql -U skills -d skills_hub -tAc "SELECT count(*) FROM skills;" 2>/dev/null || echo "0")
  if [ "$skill_count" = "0" ]; then
    log "Seeding demo data..."
    npx tsx prisma/seed.ts
    ok "Database seeded"
  else
    ok "Database already has data ($skill_count skills) — skipping seed"
  fi
}

# Start the Next.js app
start_app() {
  log "Starting Next.js development server..."
  cd "$PROJECT_DIR"

  # Install dependencies if needed
  if [ ! -d node_modules ]; then
    log "Installing dependencies..."
    npm install --legacy-peer-deps --silent
  fi

  echo ""
  echo "============================================="
  echo "  Enterprise Skills Hub - Running"
  echo "============================================="
  echo ""
  echo "  Application:    http://localhost:3000"
  echo "  MinIO Console:  http://localhost:9001"
  echo "  Prometheus:     http://localhost:9090"
  echo "  Grafana:        http://localhost:3001"
  echo "  Elasticsearch:  http://localhost:9200"
  echo ""
  echo "  Login: alice@acme.com / password123"
  echo "  Org:   acme-corp"
  echo ""
  echo "  Press Ctrl+C to stop the app"
  echo "============================================="
  echo ""

  npm run dev
}

# Stop infrastructure
stop_infra() {
  log "Stopping infrastructure services..."
  cd "$PROJECT_DIR"
  $COMPOSE_CMD -f podman-compose.yml down
  ok "All services stopped"
}

# Show status
show_status() {
  cd "$PROJECT_DIR"
  echo ""
  echo "=== Infrastructure Status ==="
  $COMPOSE_CMD -f podman-compose.yml ps
  echo ""
  echo "=== Service Endpoints ==="
  echo "  PostgreSQL:     localhost:5432"
  echo "  Redis:          localhost:6379"
  echo "  MinIO API:      localhost:9000"
  echo "  MinIO Console:  localhost:9001"
  echo "  Elasticsearch:  localhost:9200"
  echo "  Prometheus:     localhost:9090"
  echo "  Grafana:        localhost:3001"
  echo ""
}

# =============================================================================
# Main
# =============================================================================

case "${1:-}" in
  --stop)
    detect_compose
    stop_infra
    ;;
  --status)
    detect_compose
    show_status
    ;;
  --infra)
    detect_compose
    start_infra
    init_db
    show_status
    ;;
  --app)
    start_app
    ;;
  *)
    detect_compose
    start_infra
    init_db
    start_app
    ;;
esac
