"""
Migração de dados do CRM-PLUS para CRMPLUSV7
Copia todos os dados reais (agentes, propriedades, leads, etc.)
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# Base de dados ANTIGA (CRM-PLUS)
OLD_DB_URL = "postgresql://postgres:UrAXdgrmLTZhYpHvtIqCtkZLQQWjWTri@junction.proxy.rlwy.net:55713/railway"

# Base de dados NOVA (CRMPLUSV7)
NEW_DB_URL = "postgresql://postgres:hAdPoLOELOIIsbWDVEOhgvfXddRpzUXX@trolley.proxy.rlwy.net:22893/railway"

def migrate_table(old_cursor, new_cursor, table_name, columns=None):
    """Migra dados de uma tabela"""
    try:
        # Verificar se tabela existe na base antiga
        old_cursor.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '{table_name}'
            )
        """)
        if not old_cursor.fetchone()[0]:
            print(f"⏭️  Tabela '{table_name}' não existe na base antiga")
            return 0
        
        # Verificar se tabela existe na base nova
        new_cursor.execute(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = '{table_name}'
            )
        """)
        if not new_cursor.fetchone()[0]:
            print(f"⚠️  Tabela '{table_name}' não existe na base nova - executar init_db.py primeiro!")
            return 0
        
        # Contar registos na base antiga
        old_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = old_cursor.fetchone()[0]
        
        if count == 0:
            print(f"⏭️  Tabela '{table_name}' vazia na base antiga")
            return 0
        
        print(f"📦 Migrando {count} registos de '{table_name}'...")
        
        # Obter todas as linhas
        if columns:
            cols = ", ".join(columns)
            old_cursor.execute(f"SELECT {cols} FROM {table_name}")
        else:
            old_cursor.execute(f"SELECT * FROM {table_name}")
        
        rows = old_cursor.fetchall()
        
        if not rows:
            return 0
        
        # Preparar INSERT
        if columns:
            placeholders = ", ".join(["%s"] * len(columns))
            insert_query = f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        else:
            # Obter nomes das colunas do primeiro registo
            col_names = list(rows[0].keys())
            cols = ", ".join(col_names)
            placeholders = ", ".join(["%s"] * len(col_names))
            insert_query = f"INSERT INTO {table_name} ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
        
        # Inserir dados
        inserted = 0
        for row in rows:
            try:
                values = tuple(row.values()) if isinstance(row, dict) else row
                new_cursor.execute(insert_query, values)
                inserted += 1
            except Exception as e:
                print(f"  ⚠️  Erro ao inserir registo: {e}")
                continue
        
        print(f"  ✅ {inserted}/{count} registos migrados")
        return inserted
        
    except Exception as e:
        print(f"❌ Erro ao migrar '{table_name}': {e}")
        return 0

def main():
    print("🚀 Iniciando migração de dados CRM-PLUS → CRMPLUSV7\n")
    
    # Conectar às bases de dados
    print("📡 Conectando às bases de dados...")
    try:
        old_conn = psycopg2.connect(OLD_DB_URL, cursor_factory=RealDictCursor)
        new_conn = psycopg2.connect(NEW_DB_URL, cursor_factory=RealDictCursor)
        print("  ✅ Conexões estabelecidas\n")
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        sys.exit(1)
    
    old_cursor = old_conn.cursor()
    new_cursor = new_conn.cursor()
    
    # Ordem de migração (respeitando dependências foreign keys)
    migration_order = [
        # 1. Tabelas independentes
        "users",
        "agencies",
        
        # 2. Tabelas que dependem de users
        "agents",
        "teams",
        
        # 3. Propriedades
        "properties",
        
        # 4. Leads
        "leads",
        
        # 5. Relações e dados dependentes
        "calendar_events",
        "visits",
        "lead_property_matches",
        "first_impressions",
        "notifications",
        "feed_items",
        "billing_plans",
        "billing_records",
        "refresh_tokens",
        "events",
    ]
    
    total_migrated = 0
    
    for table in migration_order:
        migrated = migrate_table(old_cursor, new_cursor, table)
        total_migrated += migrated
        new_conn.commit()  # Commit após cada tabela
    
    # Fechar conexões
    old_cursor.close()
    new_cursor.close()
    old_conn.close()
    new_conn.close()
    
    print(f"\n✅ Migração concluída! Total: {total_migrated} registos migrados")
    print("\n📊 Próximos passos:")
    print("  1. Verificar dados no Railway Dashboard")
    print("  2. Testar login com credenciais existentes")
    print("  3. Verificar propriedades e agentes no mobile app")

if __name__ == "__main__":
    main()
