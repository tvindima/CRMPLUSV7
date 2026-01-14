"""
Script para adicionar colunas de watermark à tabela crm_settings em TODOS os tenants.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text

# Railway database URL diretamente
DATABASE_URL = "postgresql://postgres:JGLGYPsocBYwZMKEzcOOnmqYXDYuzfvt@junction.proxy.rlwy.net:29595/railway"

def fix_all_tenants():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Listar todos os schemas de tenants
        result = conn.execute(text("""
            SELECT schema_name FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%'
            ORDER BY schema_name
        """))
        tenants = [row[0] for row in result]
        
        print(f"Encontrados {len(tenants)} tenants: {tenants}")
        
        # Colunas que devem existir na tabela crm_settings
        columns_to_add = [
            ("watermark_enabled", "INTEGER DEFAULT 1"),
            ("watermark_image_url", "VARCHAR"),
            ("watermark_opacity", "FLOAT DEFAULT 0.6"),
            ("watermark_scale", "FLOAT DEFAULT 0.15"),
            ("watermark_position", "VARCHAR DEFAULT 'bottom-right'"),
            ("agency_name", "VARCHAR DEFAULT 'CRM Plus'"),
            ("agency_logo_url", "VARCHAR"),
            ("agency_slogan", "VARCHAR DEFAULT 'Powered by CRM Plus'"),
            ("primary_color", "VARCHAR DEFAULT '#E10600'"),
            ("secondary_color", "VARCHAR DEFAULT '#C5C5C5'"),
            ("background_color", "VARCHAR DEFAULT '#0B0B0D'"),
            ("background_secondary", "VARCHAR DEFAULT '#1A1A1F'"),
            ("text_color", "VARCHAR DEFAULT '#FFFFFF'"),
            ("text_muted", "VARCHAR DEFAULT '#9CA3AF'"),
            ("border_color", "VARCHAR DEFAULT '#2A2A2E'"),
            ("accent_color", "VARCHAR DEFAULT '#E10600'"),
            ("max_photos_per_property", "INTEGER DEFAULT 30"),
            ("max_video_size_mb", "INTEGER DEFAULT 100"),
            ("max_image_size_mb", "INTEGER DEFAULT 20"),
        ]
        
        for tenant_schema in tenants:
            print(f"\n=== Processando {tenant_schema} ===")
            
            # Verificar se tabela crm_settings existe
            result = conn.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = '{tenant_schema}' AND table_name = 'crm_settings'
                )
            """))
            table_exists = result.scalar()
            
            if not table_exists:
                print(f"  [!] Tabela crm_settings não existe - criando...")
                conn.execute(text(f"""
                    CREATE TABLE {tenant_schema}.crm_settings (
                        id SERIAL PRIMARY KEY,
                        watermark_enabled INTEGER DEFAULT 1,
                        watermark_image_url VARCHAR,
                        watermark_opacity FLOAT DEFAULT 0.6,
                        watermark_scale FLOAT DEFAULT 0.15,
                        watermark_position VARCHAR DEFAULT 'bottom-right',
                        agency_name VARCHAR DEFAULT 'CRM Plus',
                        agency_logo_url VARCHAR,
                        agency_slogan VARCHAR DEFAULT 'Powered by CRM Plus',
                        primary_color VARCHAR DEFAULT '#E10600',
                        secondary_color VARCHAR DEFAULT '#C5C5C5',
                        background_color VARCHAR DEFAULT '#0B0B0D',
                        background_secondary VARCHAR DEFAULT '#1A1A1F',
                        text_color VARCHAR DEFAULT '#FFFFFF',
                        text_muted VARCHAR DEFAULT '#9CA3AF',
                        border_color VARCHAR DEFAULT '#2A2A2E',
                        accent_color VARCHAR DEFAULT '#E10600',
                        max_photos_per_property INTEGER DEFAULT 30,
                        max_video_size_mb INTEGER DEFAULT 100,
                        max_image_size_mb INTEGER DEFAULT 20,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                """))
                conn.execute(text(f"INSERT INTO {tenant_schema}.crm_settings DEFAULT VALUES"))
                conn.commit()
                print(f"  [OK] Tabela criada e registo inicial inserido")
                continue
            
            # Obter colunas existentes
            result = conn.execute(text(f"""
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = '{tenant_schema}' AND table_name = 'crm_settings'
            """))
            existing_columns = {row[0] for row in result}
            print(f"  Colunas existentes: {existing_columns}")
            
            # Adicionar colunas que faltam
            for col_name, col_def in columns_to_add:
                if col_name not in existing_columns:
                    print(f"  [+] Adicionando coluna: {col_name}")
                    try:
                        conn.execute(text(f"""
                            ALTER TABLE {tenant_schema}.crm_settings 
                            ADD COLUMN {col_name} {col_def}
                        """))
                        conn.commit()
                    except Exception as e:
                        print(f"      Erro: {e}")
                        conn.rollback()
            
            # Garantir que existe pelo menos 1 registo
            result = conn.execute(text(f"SELECT COUNT(*) FROM {tenant_schema}.crm_settings"))
            count = result.scalar()
            if count == 0:
                print(f"  [+] Inserindo registo inicial de settings")
                conn.execute(text(f"INSERT INTO {tenant_schema}.crm_settings DEFAULT VALUES"))
                conn.commit()
            
            print(f"  [OK] {tenant_schema} atualizado")
        
        print("\n=== TODOS OS TENANTS ATUALIZADOS ===")

if __name__ == "__main__":
    fix_all_tenants()
