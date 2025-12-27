"""Script para verificar e resetar password do admin"""
import os
import sys
sys.path.insert(0, os.getcwd())

from app.database import SessionLocal
from app.users.models import User
from app.users.services import hash_password, verify_password

db = SessionLocal()

# Buscar user admin
user = db.query(User).filter(User.email == "tvindima@imoveismais.pt").first()

if user:
    print(f"User encontrado:")
    print(f"  ID: {user.id}")
    print(f"  Email: {user.email}")
    print(f"  Role: {user.role}")
    print(f"  is_active: {user.is_active}")
    print(f"  hashed_password existe: {bool(user.hashed_password)}")
    print(f"  hashed_password (primeiros 20 chars): {user.hashed_password[:20] if user.hashed_password else 'VAZIO'}")
    
    # Testar password
    test_password = "admin123"
    if user.hashed_password:
        is_valid = verify_password(test_password, user.hashed_password)
        print(f"  Password 'admin123' válida: {is_valid}")
    else:
        print("  ERRO: hashed_password está vazio!")
else:
    print("User tvindima@imoveismais.pt NÃO encontrado!")
    print("\nUsers existentes:")
    users = db.query(User).all()
    for u in users[:10]:
        print(f"  - {u.email} (role: {u.role}, active: {u.is_active})")

db.close()
