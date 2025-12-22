#!/bin/bash
set -e

echo "🚀 Starting CRM Plus V7..."

# Skip migrations on first deploy (DB empty)
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Running migrations..."
    alembic upgrade head
fi

echo "🌐 Starting Uvicorn..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
