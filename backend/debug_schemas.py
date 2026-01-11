"""Debug script para verificar dados em cada schema"""
import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'N/A'}")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Verificar dados em cada schema
    for schema in ["tenant_imoveismais", "tenant_luisgaspar"]:
        print(f"\n=== Schema: {schema} ===")
        conn.execute(text(f'SET search_path TO "{schema}", public'))
        result = conn.execute(text("SELECT agency_name, agency_slogan FROM crm_settings"))
        row = result.first()
        if row:
            print(f"  agency_name: {row[0]}")
            print(f"  agency_slogan: {row[1]}")
        else:
            print("  (sem dados)")

engine.dispose()
