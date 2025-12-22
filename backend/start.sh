#!/bin/bash
set -e

echo "🚀 Starting CRM Plus V7..."

# Check if we should run migrations/init
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Initializing database..."
    python init_db.py
fi

echo "🌐 Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
