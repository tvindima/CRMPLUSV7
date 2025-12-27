"""Fix website_clients assigned_agent_id FK to point to agents table

Revision ID: fix_website_clients_fk
Revises: 
Create Date: 2025-12-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'fix_website_clients_fk'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Verificar se tabela existe
    if 'website_clients' not in inspector.get_table_names():
        return
    
    # Obter FKs existentes
    fks = inspector.get_foreign_keys('website_clients')
    
    # Remover FK antiga para users.id se existir
    for fk in fks:
        if fk.get('constrained_columns') == ['assigned_agent_id']:
            if fk.get('referred_table') == 'users':
                # Drop the old FK constraint
                try:
                    op.drop_constraint(fk['name'], 'website_clients', type_='foreignkey')
                except Exception as e:
                    print(f"Could not drop FK {fk['name']}: {e}")
    
    # Adicionar nova FK para agents.id (se não existir)
    try:
        op.create_foreign_key(
            'fk_website_clients_agent',
            'website_clients',
            'agents',
            ['assigned_agent_id'],
            ['id'],
            ondelete='SET NULL'
        )
    except Exception as e:
        print(f"Could not create FK to agents: {e}")


def downgrade() -> None:
    pass
