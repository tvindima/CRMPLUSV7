"""Script para criar um novo registo de teste"""
import os
import sys
sys.path.insert(0, '/app')

from datetime import datetime, timedelta, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import secrets
import bcrypt

# Database URL
DATABASE_URL = os.environ.get("DATABASE_URL", "").replace("postgres://", "postgresql://")

if not DATABASE_URL:
    print("DATABASE_URL não definido")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Dados de teste
email = "admin@trioto.tech"
name = "Tiago"
company = "Trioto Test"
password = "Test2024!"
code = "999888"
token = secrets.token_urlsafe(32)
expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
hashed_pwd = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

try:
    # Deletar registos antigos com este email
    db.execute(text("DELETE FROM email_verifications WHERE email = :email"), {"email": email})
    db.commit()
    print(f"Registos antigos deletados para {email}")
    
    # Criar novo registo
    db.execute(text("""
        INSERT INTO email_verifications 
        (email, name, company_name, hashed_password, sector, verification_code, verification_token, expires_at)
        VALUES (:email, :name, :company, :pwd, 'real_estate', :code, :token, :expires)
    """), {
        "email": email,
        "name": name,
        "company": company,
        "pwd": hashed_pwd,
        "code": code,
        "token": token,
        "expires": expires_at
    })
    db.commit()
    
    print(f"\n✅ Novo registo criado!")
    print(f"   Email: {email}")
    print(f"   Empresa: {company}")
    print(f"   Código de verificação: {code}")
    print(f"   Token: {token[:20]}...")
    print(f"   Expira: {expires_at}")
    print(f"\n📧 Use o código {code} na página /verificar")
    
except Exception as e:
    print(f"Erro: {e}")
    db.rollback()
finally:
    db.close()
