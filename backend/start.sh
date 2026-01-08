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

# Always run alembic migrations to keep schema up to date
echo "🔄 Running database migrations..."
if alembic upgrade head; then
    echo "✅ Migrations applied successfully"
else
    echo "⚠️ Alembic migration failed, trying with heads..."
    if alembic upgrade heads; then
        echo "✅ Migrations applied with 'heads'"
    else
        echo "⚠️ Alembic failed, applying critical columns directly..."
        # Apply critical missing columns
        python -c "
from app.database import SessionLocal, engine
from sqlalchemy import text

db = SessionLocal()
try:
    # Add nif and address to agents if missing
    db.execute(text('ALTER TABLE agents ADD COLUMN IF NOT EXISTS nif VARCHAR(20);'))
    db.execute(text('ALTER TABLE agents ADD COLUMN IF NOT EXISTS address VARCHAR(500);'))
    
    # Add tipo_imovel to first_impressions if missing
    db.execute(text('ALTER TABLE first_impressions ADD COLUMN IF NOT EXISTS tipo_imovel VARCHAR(100);'))
    
    # Add tipo_imovel to pre_angariacoes if missing
    db.execute(text('ALTER TABLE pre_angariacoes ADD COLUMN IF NOT EXISTS tipo_imovel VARCHAR(100);'))
    
    db.commit()
    print('✅ Critical columns added directly')
except Exception as e:
    print(f'❌ Error: {e}')
    db.rollback()
finally:
    db.close()
" || echo "❌ Direct SQL fix also failed"
    fi
fi

echo "🌐 Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
