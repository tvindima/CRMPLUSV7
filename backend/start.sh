#!/bin/bash
set -e

echo "🚀 Starting CRM Plus V7..."

# Debug: mostrar variáveis de ambiente relevantes (sem expor valores sensíveis)
echo "📋 Environment check:"
echo "  - GCP_VISION_ENABLE: ${GCP_VISION_ENABLE:-not set}"
echo "  - GCP_VISION_ENABLED: ${GCP_VISION_ENABLED:-not set}"
echo "  - GCP_VISION_KEY_B64: ${GCP_VISION_KEY_B64:+set (hidden)}"
echo "  - GCP_VISION_PROJECT_ID: ${GCP_VISION_PROJECT_ID:-not set}"

# Materializar chave do Google Vision se enviada em base64
if [ -n "$GCP_VISION_KEY_B64" ]; then
    echo "🔑 Writing Google Vision key to /app/vision-key.json"
    if echo "$GCP_VISION_KEY_B64" | base64 -d > /app/vision-key.json 2>/dev/null; then
        export GOOGLE_APPLICATION_CREDENTIALS="/app/vision-key.json"
        echo "✅ Vision key written successfully"
        echo "  - File size: $(wc -c < /app/vision-key.json) bytes"
    else
        echo "❌ Failed to decode Vision key from base64"
    fi
else
    echo "⚠️ GCP_VISION_KEY_B64 not set - Vision OCR will not work"
fi

# Check if we should run migrations/init
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Initializing database..."
    python init_db.py
fi

echo "🌐 Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
