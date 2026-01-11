import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import bcrypt

DATABASE_URL = os.environ.get("DATABASE_URL", "").replace("postgres://", "postgresql://")
if not DATABASE_URL:
    print("DATABASE_URL não definido")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Nova password conhecida
new_password = "Lenitronik2024!"
new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

try:
    # Atualizar password no schema do tenant
    db.execute(text('SET search_path TO "tenant_lenitronik", public'))
    
    # Verificar se user existe
    result = db.execute(text("SELECT id, email, name FROM users WHERE email = 'admin@trioto.tech'")).fetchone()
    
    if result:
        print(f"User encontrado: ID={result[0]}, Email={result[1]}, Name={result[2]}")
        
        # Atualizar password
        db.execute(text("""
            UPDATE users SET hashed_password = :pwd WHERE email = 'admin@trioto.tech'
        """), {"pwd": new_hash})
        db.commit()
        
        print(f"\n✅ Password atualizada com sucesso!")
        print(f"   Email: admin@trioto.tech")
        print(f"   Nova Password: {new_password}")
    else:
        print("❌ User admin@trioto.tech não encontrado no schema tenant_lenitronik")
        
        # Listar users existentes
        users = db.execute(text("SELECT id, email, name, role FROM users")).fetchall()
        print(f"\nUsers no schema:")
        for u in users:
            print(f"  - {u[1]} ({u[2]}) - role: {u[3]}")
            
except Exception as e:
    print(f"Erro: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.execute(text('SET search_path TO public'))
    db.close()
