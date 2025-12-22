#!/usr/bin/env python3
"""
Script para configurar agentes e users no CRMPLUSV7
- Atualiza dados dos agentes (nome, email)
- Cria users para cada agente com password: {iniciais}crmtest

Executar com: python setup_agent_users.py
Requer DATABASE_URL configurada ou conexão PostgreSQL
"""

import os
import sys
import bcrypt


def hash_password(password: str) -> str:
    """Hash password using bcrypt (mesmo método que o backend usa)"""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

# Dados dos 19 agentes reais
AGENTES = [
    {"id": 24, "name": "António Silva", "email": "asilva@imoveismais.pt", "initials": "AS"},
    {"id": 25, "name": "Hugo Belo", "email": "hbelo@imoveismais.pt", "initials": "HB"},
    {"id": 26, "name": "Bruno Libânio", "email": "blibanio@imoveismais.pt", "initials": "BL"},
    {"id": 27, "name": "Nélson Neto", "email": "nneto@imoveismais.pt", "initials": "NN"},
    {"id": 28, "name": "João Paiva", "email": "jpaiva@imoveismais.pt", "initials": "JP"},
    {"id": 29, "name": "Marisa Barosa", "email": "arrendamentosleiria@imoveismais.pt", "initials": "MB"},
    {"id": 30, "name": "Eduardo Coelho", "email": "ecoelho@imoveismais.pt", "initials": "EC"},
    {"id": 31, "name": "João Silva", "email": "jsilva@imoveismais.pt", "initials": "JS"},
    {"id": 32, "name": "Hugo Mota", "email": "hmota@imoveismais.pt", "initials": "HM"},
    {"id": 33, "name": "João Pereira", "email": "jpereira@imoveismais.pt", "initials": "JPe"},
    {"id": 34, "name": "João Carvalho", "email": "jcarvalho@imoveismais.pt", "initials": "JC"},
    {"id": 35, "name": "Tiago Vindima", "email": "tvindima@imoveismais.pt", "initials": "TV"},
    {"id": 36, "name": "Mickael Soares", "email": "msoares@imoveismais.pt", "initials": "MS"},
    {"id": 37, "name": "Paulo Rodrigues", "email": "prodrigues@imoveismais.pt", "initials": "PR"},
    {"id": 38, "name": "Imóveis Mais Leiria", "email": "leiria@imoveismais.pt", "initials": "IL"},
    {"id": 39, "name": "Nuno Faria", "email": "nfaria@imoveismais.pt", "initials": "NF"},
    {"id": 40, "name": "Pedro Olaio", "email": "polaio@imoveismais.pt", "initials": "PO"},
    {"id": 41, "name": "João Olaio", "email": "jolaio@imoveismais.pt", "initials": "JO"},
    {"id": 42, "name": "Fábio Passos", "email": "fpassos@imoveismais.pt", "initials": "FP"},
]

def generate_sql():
    """Gera SQL para atualizar agentes e criar users"""
    
    sql_lines = []
    sql_lines.append("-- =====================================================")
    sql_lines.append("-- SETUP AGENTES E USERS - CRMPLUSV7")
    sql_lines.append("-- Password pattern: {iniciais}crmtest (lowercase)")
    sql_lines.append("-- =====================================================")
    sql_lines.append("")
    sql_lines.append("BEGIN;")
    sql_lines.append("")
    
    # 1. Atualizar dados dos agentes
    sql_lines.append("-- 1. ATUALIZAR DADOS DOS AGENTES")
    sql_lines.append("-- --------------------------------")
    for agent in AGENTES:
        sql_lines.append(f"""
UPDATE agents SET 
    name = '{agent["name"]}',
    email = '{agent["email"]}'
WHERE id = {agent["id"]};
""".strip())
    
    sql_lines.append("")
    sql_lines.append("-- 2. CRIAR/ATUALIZAR USERS PARA CADA AGENTE")
    sql_lines.append("-- ------------------------------------------")
    sql_lines.append("-- Password: {iniciais em minúsculas}crmtest")
    sql_lines.append("")
    
    # 2. Criar users para cada agente
    for agent in AGENTES:
        # Password = iniciais em minúsculas + "crmtest"
        password_plain = f"{agent['initials'].lower()}crmtest"
        password_hash = hash_password(password_plain)
        
        # Upsert: INSERT ... ON CONFLICT DO UPDATE
        sql_lines.append(f"""
-- {agent["name"]} ({agent["email"]}) - pass: {password_plain}
INSERT INTO users (email, hashed_password, role, agent_id, is_active)
VALUES ('{agent["email"]}', '{password_hash}', 'agent', {agent["id"]}, true)
ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    agent_id = EXCLUDED.agent_id,
    is_active = true;
""".strip())
        sql_lines.append("")
    
    sql_lines.append("COMMIT;")
    sql_lines.append("")
    sql_lines.append("-- =====================================================")
    sql_lines.append("-- RESUMO DE LOGINS CRIADOS:")
    sql_lines.append("-- =====================================================")
    for agent in AGENTES:
        password_plain = f"{agent['initials'].lower()}crmtest"
        sql_lines.append(f"-- {agent['name']:25} | {agent['email']:35} | {password_plain}")
    
    return "\n".join(sql_lines)


def main():
    sql = generate_sql()
    
    # Guardar ficheiro SQL
    output_path = os.path.join(os.path.dirname(__file__), "setup_agents_users.sql")
    with open(output_path, "w") as f:
        f.write(sql)
    
    print(f"✅ SQL gerado: {output_path}")
    print("\n📋 LOGINS DOS AGENTES:")
    print("-" * 80)
    print(f"{'Nome':25} | {'Email':35} | Password")
    print("-" * 80)
    for agent in AGENTES:
        password_plain = f"{agent['initials'].lower()}crmtest"
        print(f"{agent['name']:25} | {agent['email']:35} | {password_plain}")
    print("-" * 80)
    print(f"\n🔧 Execute o SQL no PostgreSQL Railway para aplicar.")


if __name__ == "__main__":
    main()
