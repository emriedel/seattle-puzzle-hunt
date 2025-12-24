#!/bin/bash

# Production database seeding script
# Pulls production env vars, re-seeds database, and invalidates cache

set -e

echo "🔑 Pulling production environment variables..."
vercel env pull .env.production.local

echo "🌱 Seeding production database..."
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) \
REVALIDATION_SECRET=$(grep REVALIDATION_SECRET .env.production.local | cut -d '=' -f2-) \
NEXT_PUBLIC_BASE_URL=$(grep NEXT_PUBLIC_BASE_URL .env.production.local | cut -d '=' -f2-) \
npm run seed

echo "✅ Production database seeded successfully!"
echo "🔄 Cache invalidation triggered automatically"
