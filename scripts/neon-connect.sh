#!/bin/bash

# Neon Local Connection Script for VS Code Extension
# This script sets up the connection for Neon Extension in VS Code

export DATABASE_URL="postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export PGPASSWORD="npg_2yGJ1IjpWEDF"

# Test connection
echo "Testing Neon connection..."
/usr/local/opt/postgresql@15/bin/psql \
  -h ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -c "SELECT version(), NOW();"

if [ $? -eq 0 ]; then
  echo "✓ Connection successful!"
  echo ""
  echo "Connection details:"
  echo "  Host: ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech"
  echo "  Port: 5432"
  echo "  User: neondb_owner"
  echo "  Database: neondb"
  echo ""
  echo "For VS Code Neon Extension, use:"
  echo "postgresql://neondb_owner:npg_2yGJ1IjpWEDF@ep-billowing-hat-accmfenf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
else
  echo "✗ Connection failed!"
  exit 1
fi
