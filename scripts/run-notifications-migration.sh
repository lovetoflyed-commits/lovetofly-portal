#!/bin/bash

# Script to run notifications table migration
# This creates the notifications table in the database

echo "🔧 Running notifications table migration..."

# Get database URL from .env.local
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found"
  exit 1
fi

# Extract DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2-)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not found in .env.local"
  exit 1
fi

# Run migration using psql
echo "📊 Connecting to database..."
psql "$DATABASE_URL" -f src/migrations/013_create_notifications_table.sql

if [ $? -eq 0 ]; then
  echo "✅ Notifications table migration completed successfully!"
  echo ""
  echo "📋 Table created:"
  echo "   - notifications (id, user_id, title, message, type, read, link, created_at)"
  echo ""
  echo "🎯 Next: The email system is ready to use!"
else
  echo "❌ Migration failed. Check the error above."
  exit 1
fi
