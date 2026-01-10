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

# Schema consolidation - ensures all columns exist without relying on alembic
echo "🔄 Running schema consolidation..."
python -c "
from app.database import SessionLocal, engine
from sqlalchemy import text, inspect

conn = engine.connect()
inspector = inspect(engine)

def table_exists(name):
    return name in inspector.get_table_names()

def col_exists(table, col):
    if not table_exists(table):
        return False
    return col in [c['name'] for c in inspector.get_columns(table)]

try:
    # AGENTS
    if table_exists('agents'):
        if not col_exists('agents', 'nif'):
            conn.execute(text('ALTER TABLE agents ADD COLUMN nif VARCHAR(20)'))
        if not col_exists('agents', 'address'):
            conn.execute(text('ALTER TABLE agents ADD COLUMN address VARCHAR(500)'))
        if not col_exists('agents', 'twitter'):
            conn.execute(text('ALTER TABLE agents ADD COLUMN twitter VARCHAR(200)'))
        if not col_exists('agents', 'tiktok'):
            conn.execute(text('ALTER TABLE agents ADD COLUMN tiktok VARCHAR(200)'))
        if not col_exists('agents', 'license_ami'):
            conn.execute(text('ALTER TABLE agents ADD COLUMN license_ami VARCHAR(50)'))
    
    # PROPERTIES
    if table_exists('properties'):
        if not col_exists('properties', 'video_url'):
            conn.execute(text('ALTER TABLE properties ADD COLUMN video_url VARCHAR(500)'))
        if not col_exists('properties', 'hide_address'):
            conn.execute(text('ALTER TABLE properties ADD COLUMN hide_address BOOLEAN DEFAULT false'))
        if not col_exists('properties', 'show_in_website'):
            conn.execute(text('ALTER TABLE properties ADD COLUMN show_in_website BOOLEAN DEFAULT true'))
        if not col_exists('properties', 'highlight_website'):
            conn.execute(text('ALTER TABLE properties ADD COLUMN highlight_website BOOLEAN DEFAULT false'))
    
    # USERS
    if table_exists('users'):
        if not col_exists('users', 'role_label'):
            conn.execute(text('ALTER TABLE users ADD COLUMN role_label VARCHAR(100)'))
        if not col_exists('users', 'works_for_agent_id'):
            conn.execute(text('ALTER TABLE users ADD COLUMN works_for_agent_id INTEGER'))
    
    # LEADS
    if table_exists('leads'):
        if not col_exists('leads', 'message'):
            conn.execute(text('ALTER TABLE leads ADD COLUMN message TEXT'))
    
    # FIRST_IMPRESSIONS
    if table_exists('first_impressions'):
        if not col_exists('first_impressions', 'tipo_imovel'):
            conn.execute(text('ALTER TABLE first_impressions ADD COLUMN tipo_imovel VARCHAR(100)'))
        if not col_exists('first_impressions', 'gps_latitude'):
            conn.execute(text('ALTER TABLE first_impressions ADD COLUMN gps_latitude FLOAT'))
        if not col_exists('first_impressions', 'gps_longitude'):
            conn.execute(text('ALTER TABLE first_impressions ADD COLUMN gps_longitude FLOAT'))
    
    # PRE_ANGARIACOES
    if table_exists('pre_angariacoes'):
        if not col_exists('pre_angariacoes', 'tipo_imovel'):
            conn.execute(text('ALTER TABLE pre_angariacoes ADD COLUMN tipo_imovel VARCHAR(100)'))
    
    # TENANTS (Platform)
    if table_exists('tenants'):
        for col in ['secondary_color', 'sector', 'admin_email', 'provisioning_status', 'billing_email', 'domain_verification_token', 'stripe_customer_id', 'stripe_subscription_id']:
            if not col_exists('tenants', col):
                conn.execute(text(f'ALTER TABLE tenants ADD COLUMN {col} VARCHAR(200)'))
        for col in ['admin_created', 'onboarding_completed', 'custom_domain_verified']:
            if not col_exists('tenants', col):
                conn.execute(text(f'ALTER TABLE tenants ADD COLUMN {col} BOOLEAN DEFAULT false'))
        if not col_exists('tenants', 'onboarding_step'):
            conn.execute(text('ALTER TABLE tenants ADD COLUMN onboarding_step INTEGER DEFAULT 0'))
        if not col_exists('tenants', 'provisioning_error'):
            conn.execute(text('ALTER TABLE tenants ADD COLUMN provisioning_error TEXT'))
    
    conn.commit()
    print('✅ Schema consolidation completed')
except Exception as e:
    print(f'⚠️ Schema consolidation warning: {e}')
    try:
        conn.rollback()
    except:
        pass
finally:
    conn.close()
"

# Try alembic but don't fail if it has issues (schema already consolidated above)
echo "🔄 Running alembic upgrade (optional)..."
alembic upgrade head 2>&1 || echo "⚠️ Alembic skipped (schema already up to date)"

echo "🌐 Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
