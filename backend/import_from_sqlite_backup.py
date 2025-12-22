"""
Importar dados dos backups SQLite do CRM-PLUS para PostgreSQL CRMPLUSV7
Converte automaticamente tipos de dados e respeita foreign keys
"""
import psycopg2
from psycopg2.extras import execute_values
import re
import json

# Base de dados NOVA (CRMPLUSV7 no Railway)
NEW_DB_URL = "postgresql://postgres:hAdPoLOELOIIsbWDVEOhgvfXddRpzUXX@trolley.proxy.rlwy.net:22893/railway"

# Caminhos dos backups SQLite
BACKUPS_DIR = "/Users/tiago.vindima/Desktop"
AGENTS_FILE = f"{BACKUPS_DIR}/crm-plus-agents-dump.sql"
PROPERTIES_FILE = f"{BACKUPS_DIR}/crm-plus-properties-dump.sql"
LEADS_FILE = f"{BACKUPS_DIR}/crm-plus-leads-dump.sql"

def parse_sqlite_insert(line):
    """
    Parse uma linha INSERT do SQLite
    Ex: INSERT INTO agents VALUES(1,'Nome','email@x.pt','912...',NULL,NULL);
    """
    if not line.startswith('INSERT INTO'):
        return None
    
    # Extrair nome da tabela
    match = re.match(r'INSERT INTO (\w+) VALUES\((.*)\);', line)
    if not match:
        return None
    
    table_name = match.group(1)
    values_str = match.group(2)
    
    # Parse dos valores (simplificado, assume vírgulas não estão dentro de strings)
    # Para strings com vírgulas, precisa de parser mais sofisticado
    values = []
    current_value = ""
    in_string = False
    
    i = 0
    while i < len(values_str):
        char = values_str[i]
        
        if char == "'" and (i == 0 or values_str[i-1] != '\\'):
            in_string = not in_string
            current_value += char
        elif char == ',' and not in_string:
            values.append(parse_value(current_value.strip()))
            current_value = ""
        else:
            current_value += char
        
        i += 1
    
    # Adicionar último valor
    if current_value:
        values.append(parse_value(current_value.strip()))
    
    return table_name, values

def parse_value(value_str):
    """Converte valor SQLite para Python"""
    value_str = value_str.strip()
    
    # NULL
    if value_str.upper() == 'NULL':
        return None
    
    # String (remover aspas)
    if value_str.startswith("'") and value_str.endswith("'"):
        # Unescape aspas internas
        return value_str[1:-1].replace("''", "'")
    
    # Número (antes de verificar boolean para evitar confusão)
    try:
        if '.' in value_str:
            return float(value_str)
        return int(value_str)
    except ValueError:
        pass
    
    # Se não for número, retornar como string
    return value_str

def import_agents(cursor):
    """Importa agentes do backup SQLite"""
    print("\n📦 Importando agentes...")
    
    with open(AGENTS_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    agents_data = []
    for line in lines:
        result = parse_sqlite_insert(line)
        if result:
            table_name, values = result
            if table_name == 'agents':
                agents_data.append(values)
    
    if not agents_data:
        print("  ⚠️  Nenhum agente encontrado")
        return 0
    
    # Inserir agentes
    insert_query = """
        INSERT INTO agents (id, name, email, phone, team_id, agency_id, avatar_url, license_ami, bio, instagram, facebook, linkedin, whatsapp)
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone
    """
    
    execute_values(cursor, insert_query, agents_data)
    print(f"  ✅ {len(agents_data)} agentes importados")
    return len(agents_data)

def import_properties(cursor):
    """Importa propriedades do backup SQLite"""
    print("\n📦 Importando propriedades...")
    
    with open(PROPERTIES_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extrair todas as linhas INSERT
    insert_pattern = r"INSERT INTO properties VALUES\((.*?)\);"
    matches = re.finditer(insert_pattern, content, re.DOTALL)
    
    properties_data = []
    missing_agent_ids = set()
    
    for match in matches:
        values_str = match.group(1)
        
        # Parse manual dos valores (mais robusto para strings longas)
        values = []
        current = ""
        in_string = False
        in_array = False
        
        for i, char in enumerate(values_str):
            if char == "'" and (i == 0 or values_str[i-1] != '\\'):
                in_string = not in_string
                current += char
            elif char == '[':
                in_array = True
                current += char
            elif char == ']':
                in_array = False
                current += char
            elif char == ',' and not in_string and not in_array:
                values.append(parse_value(current.strip()))
                current = ""
            else:
                current += char
        
        if current:
            values.append(parse_value(current.strip()))
        
        # Coletar agent_ids que faltam (posição 17 no array)
        if len(values) > 17 and values[17] is not None:
            missing_agent_ids.add(values[17])
        
        properties_data.append(values)
    
    if not properties_data:
        print("  ⚠️  Nenhuma propriedade encontrada")
        return 0
    
    # Verificar e criar agentes que faltam
    cursor.execute("SELECT id FROM agents")
    existing_agent_ids = {row[0] for row in cursor.fetchall()}
    missing = missing_agent_ids - existing_agent_ids
    
    if missing:
        print(f"  🔧 Criando {len(missing)} agentes que faltam: {sorted(missing)}")
        for agent_id in missing:
            cursor.execute("""
                INSERT INTO agents (id, name, email, phone)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (agent_id, f'Agente #{agent_id}', f'agent{agent_id}@imoveismais.pt', None))
    
    # Inserir propriedades (29 colunas conforme schema)
    insert_query = """
        INSERT INTO properties (
            id, reference, title, business_type, property_type, typology,
            description, observations, price, usable_area, land_area,
            location, municipality, parish, condition, energy_certificate,
            status, agent_id, images, created_at, updated_at,
            is_published, is_featured, latitude, longitude,
            bedrooms, bathrooms, parking_spaces, video_url
        )
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            price = EXCLUDED.price,
            status = EXCLUDED.status
    """
    
    execute_values(cursor, insert_query, properties_data)
    print(f"  ✅ {len(properties_data)} propriedades importadas")
    return len(properties_data)

def import_leads(cursor):
    """Importa leads do backup SQLite"""
    print("\n📦 Importando leads...")
    
    try:
        with open(LEADS_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("  ⚠️  Ficheiro de leads não encontrado")
        return 0
    
    leads_data = []
    for line in lines:
        result = parse_sqlite_insert(line)
        if result:
            table_name, values = result
            if table_name == 'leads':
                # SQLite: id, name, email, phone, message, source, origin, status, assigned_agent_id, property_id, action_type, created_at, updated_at (13 cols)
                # PostgreSQL: id, name, email, phone, source, origin, status, assigned_agent_id, property_id, action_type, created_at, updated_at (12 cols - SEM message)
                # Remover coluna 'message' (índice 4)
                adjusted_values = values[:4] + values[5:]  # Skip message
                leads_data.append(adjusted_values)
    
    if not leads_data:
        print("  ⚠️  Nenhum lead encontrado")
        return 0
    
    # Schema PostgreSQL sem 'message'
    insert_query = """
        INSERT INTO leads (id, name, email, phone, source, origin, status, assigned_agent_id, property_id, action_type, created_at, updated_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING
    """
    execute_values(cursor, insert_query, leads_data)
    print(f"  ✅ {len(leads_data)} leads importados")
    return len(leads_data)

def reset_sequences(cursor):
    """Reset das sequences PostgreSQL para não haver conflitos de IDs"""
    print("\n🔧 Ajustando sequences...")
    
    tables = ['agents', 'properties', 'leads']
    
    for table in tables:
        try:
            cursor.execute(f"SELECT MAX(id) FROM {table}")
            max_id = cursor.fetchone()[0]
            if max_id:
                cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), {max_id}, true)")
                print(f"  ✅ Sequence de '{table}' ajustada para {max_id}")
        except Exception as e:
            print(f"  ⚠️  Erro ao ajustar sequence de '{table}': {e}")

def main():
    print("🚀 Importação de dados CRM-PLUS → CRMPLUSV7")
    print("="*60)
    
    # Conectar à base de dados
    print("\n📡 Conectando ao PostgreSQL CRMPLUSV7...")
    try:
        conn = psycopg2.connect(NEW_DB_URL)
        cursor = conn.cursor()
        print("  ✅ Conectado com sucesso!")
    except Exception as e:
        print(f"  ❌ Erro de conexão: {e}")
        return
    
    total_imported = 0
    
    try:
        # Ordem de importação (respeitar foreign keys)
        total_imported += import_agents(cursor)
        conn.commit()
        
        total_imported += import_properties(cursor)
        conn.commit()
        
        total_imported += import_leads(cursor)
        conn.commit()
        
        # Ajustar sequences
        reset_sequences(cursor)
        conn.commit()
        
        print("\n" + "="*60)
        print(f"✅ Importação concluída! Total: {total_imported} registos")
        print("\n📊 Verificação:")
        
        # Verificar contagens finais
        cursor.execute("SELECT COUNT(*) FROM agents")
        print(f"  👥 Agentes: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM properties")
        print(f"  🏠 Propriedades: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM leads")
        print(f"  📧 Leads: {cursor.fetchone()[0]}")
        
        print("\n🎉 Dados reais do CRM-PLUS agora disponíveis em CRMPLUSV7!")
        
    except Exception as e:
        print(f"\n❌ Erro durante importação: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
