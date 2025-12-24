#!/bin/bash
set -e

echo "🚀 Starting CRM Plus V7..."

# Materializar chave do Google Vision se enviada em base64
if [ -n "$GCP_VISION_KEY_B64" ]; then
    echo "🔑 Writing Google Vision key to /app/vision-key.json"
    echo "$GCP_VISION_KEY_B64" | base64 -d > /app/vision-key.json || true
    export GOOGLE_APPLICATION_CREDENTIALS="/app/vision-key.json"
fi

# Check if we should run migrations/init
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Initializing database..."
    python init_db.py
fi

echo "🌐 Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
