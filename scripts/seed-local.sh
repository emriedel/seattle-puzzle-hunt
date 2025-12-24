#!/bin/bash

# Local database seeding script
# Re-seeds the local database with hunt data

set -e

echo "🌱 Seeding local database..."
npm run seed

echo "✅ Local database seeded successfully!"
