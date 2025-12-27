#!/usr/bin/env python3
"""
Script para criar os users de staff (backoffice) que aparecem no site público.
"""
import os
import sys

# Adicionar o diretório atual ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.users.models import User, UserRole
from app.agents.models import Agent
from app.security import hash_password

def create_staff_users():
    db = SessionLocal()
    
    # Staff members a criar
    staff_to_create = [
        {
            "email": "m.olaio@imoveismais.pt",
            "full_name": "Maria Olaio",
            "role": UserRole.COORDINATOR.value,
            "phone": "244001003",
            "password": "staff2024",  # Password inicial
            "works_for_agent_name": None,
            "role_label": "Diretora Financeira",
        },
        {
            "email": "a.borges@imoveismais.pt",
            "full_name": "Andreia Borges",
            "role": UserRole.COORDINATOR.value,
            "phone": "244001004",
            "password": "staff2024",
            "works_for_agent_name": None,
            "role_label": "Assistente Administrativa",
        },
        {
            "email": "s.ferreira@imoveismais.pt",
            "full_name": "Sara Ferreira",
            "role": UserRole.COORDINATOR.value,
            "phone": "244001002",
            "password": "staff2024",
            "works_for_agent_name": None,
            "role_label": "Assistente Administrativa",
        },
        {
            "email": "c.libanio@imoveismais.pt",
            "full_name": "Cláudia Libânio",
            "role": UserRole.ASSISTANT.value,
            "phone": "912118911",
            "password": "staff2024",
            "works_for_agent_name": "Bruno Libânio",
            "role_label": None,  # Será gerado automaticamente como "Assistente de Bruno Libânio"
        },
    ]
    
    try:
        for staff_data in staff_to_create:
            # Verificar se já existe
            existing = db.query(User).filter(User.email == staff_data["email"]).first()
            if existing:
                print(f"✓ User já existe: {staff_data['full_name']} ({staff_data['email']})")
                updated = False
                # Atualizar telefone se diferente
                if existing.phone != staff_data["phone"]:
                    existing.phone = staff_data["phone"]
                    print(f"  → Telefone atualizado para: {staff_data['phone']}")
                    updated = True
                # Atualizar role_label se diferente
                if staff_data.get("role_label") and existing.role_label != staff_data.get("role_label"):
                    existing.role_label = staff_data.get("role_label")
                    print(f"  → Role label atualizado para: {staff_data.get('role_label')}")
                    updated = True
                continue
            
            # Buscar agent_id se for assistente de alguém
            works_for_agent_id = None
            if staff_data.get("works_for_agent_name"):
                agent = db.query(Agent).filter(Agent.name == staff_data["works_for_agent_name"]).first()
                if agent:
                    works_for_agent_id = agent.id
                    print(f"  → Trabalha para: {agent.name} (ID: {agent.id})")
            
            # Criar user
            new_user = User(
                email=staff_data["email"],
                hashed_password=hash_password(staff_data["password"]),
                full_name=staff_data["full_name"],
                role=staff_data["role"],
                phone=staff_data["phone"],
                is_active=True,
                works_for_agent_id=works_for_agent_id,
                role_label=staff_data.get("role_label"),
            )
            db.add(new_user)
            db.flush()  # Para obter o ID
            print(f"✓ Criado: {staff_data['full_name']} (ID: {new_user.id}, Role: {staff_data['role']})")
        
        db.commit()
        print("\n✅ Todos os staff users foram criados/verificados!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_staff_users()
