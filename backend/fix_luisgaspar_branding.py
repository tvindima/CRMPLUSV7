"""
Script para corrigir branding do tenant Luis Gaspar Imobiliária
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Usar a mesma DATABASE_URL do Railway
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL não encontrada")
    exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

try:
    # Schema do tenant Luis Gaspar
    schema_name = "tenant_luisgaspar"
    
    print(f"🔧 Configurando branding para {schema_name}...")
    
    # Definir search_path para o schema do tenant
    db.execute(text(f'SET search_path TO "{schema_name}", public'))
    
    # Verificar se já existe settings
    result = db.execute(text("SELECT COUNT(*) FROM crm_settings"))
    count = result.scalar()
    
    if count == 0:
        print("📝 Criando novo registo de CRMSettings...")
        db.execute(text("""
            INSERT INTO crm_settings (
                agency_name,
                agency_slogan,
                agency_logo_url,
                primary_color,
                secondary_color,
                background_color,
                background_secondary,
                text_color,
                text_muted,
                border_color,
                accent_color
            ) VALUES (
                'Luis Gaspar Imobiliária',
                'A sua imobiliária de confiança',
                NULL,
                '#E10600',
                '#C5C5C5',
                '#0B0B0D',
                '#1A1A1F',
                '#FFFFFF',
                '#9CA3AF',
                '#2A2A2E',
                '#E10600'
            )
        """))
    else:
        print("✏️ Atualizando registo existente...")
        db.execute(text("""
            UPDATE crm_settings SET
                agency_name = 'Luis Gaspar Imobiliária',
                agency_slogan = 'A sua imobiliária de confiança',
                primary_color = '#E10600',
                secondary_color = '#C5C5C5',
                background_color = '#0B0B0D',
                background_secondary = '#1A1A1F',
                text_color = '#FFFFFF',
                text_muted = '#9CA3AF',
                border_color = '#2A2A2E',
                accent_color = '#E10600'
        """))
    
    db.commit()
    print("✅ Branding atualizado com sucesso!")
    
    # Verificar
    result = db.execute(text("SELECT agency_name, agency_slogan FROM crm_settings"))
    row = result.first()
    print(f"\n📋 Verificação:")
    print(f"   Nome: {row[0]}")
    print(f"   Slogan: {row[1]}")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    db.rollback()
finally:
    db.close()
