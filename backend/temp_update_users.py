"""
Script para atualizar permissões de utilizadores
"""
import os
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL não encontrada")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

# Emails para tornar admin
admin_emails = [
    "tvindima@imoveismais.pt",
    "jcarvalho@imoveismais.pt",
    "msoares@imoveismais.pt",
    "prodrigues@imoveismais.pt",
    "hmota@imoveismais.pt",
    "leiria@imoveismais.pt",
    "faturacao@imoveismais.pt"
]

with engine.connect() as conn:
    # Primeiro, ver quais existem
    print("=== UTILIZADORES EXISTENTES ===")
    result = conn.execute(text("SELECT id, email, name, role FROM agents ORDER BY email"))
    existing = {}
    for row in result:
        print(f"ID: {row[0]:3} | {row[1]:40} | {row[2]:25} | role: {row[3]}")
        existing[row[1]] = row
    
    print("\n=== ATUALIZAÇÕES ===")
    for email in admin_emails:
        if email in existing:
            agent = existing[email]
            if agent[3] != 'admin':
                conn.execute(text("UPDATE agents SET role = 'admin' WHERE email = :email"), {"email": email})
                print(f"✅ {email} -> admin (era: {agent[3]})")
            else:
                print(f"⏭️  {email} já é admin")
        else:
            print(f"❌ {email} NÃO EXISTE - precisa ser criado")
    
    conn.commit()
    print("\n✅ Alterações guardadas!")
