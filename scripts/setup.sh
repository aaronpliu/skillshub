#!/bin/bash
# =============================================================================
# Enterprise Skills Hub - Local Development Setup
# =============================================================================

set -e

echo "🚀 Enterprise Skills Hub - Setup"
echo "================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install: https://docs.docker.com/get-docker/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install: https://nodejs.org/"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required."; exit 1; }

echo "✅ Prerequisites check passed"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Copy environment file if not exists
if [ ! -f .env ]; then
  echo ""
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
fi

# Start infrastructure
echo ""
echo "🐳 Starting infrastructure (PostgreSQL, Redis, MinIO, Elasticsearch)..."
docker compose up -d postgres redis minio elasticsearch

echo "⏳ Waiting for services to be ready..."
sleep 5

# Wait for PostgreSQL
until docker compose exec -T postgres pg_isready -U skills -d skills_hub >/dev/null 2>&1; do
  echo "  Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL ready"

# Wait for Redis
until docker compose exec -T redis redis-cli ping >/dev/null 2>&1; do
  echo "  Waiting for Redis..."
  sleep 2
done
echo "✅ Redis ready"

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo ""
echo "📊 Pushing database schema..."
npx prisma db push

# Seed database
echo ""
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts

# Start development server
echo ""
echo "================================="
echo "✅ Setup complete!"
echo ""
echo "📍 Access points:"
echo "   Application:    http://localhost:3000"
echo "   MinIO Console:  http://localhost:9001"
echo "   Elasticsearch:  http://localhost:9200"
echo ""
echo "🔑 Login credentials:"
echo "   Email:    alice@acme.com"
echo "   Password: password123"
echo "   Org Slug: acme-corp"
echo ""
echo "🚀 Starting development server..."
echo "================================="
npm run dev
