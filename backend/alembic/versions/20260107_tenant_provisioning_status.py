"""Add tenant provisioning status fields

Revision ID: 20260107_tenant_status
Revises: 
Create Date: 2026-01-07

Adiciona campos para tracking de estado de provisionamento:
- status: enum (pending, provisioning, ready, failed)
- provisioning_error: texto do erro se falhou
- provisioned_at: timestamp quando ficou ready
- failed_at: timestamp quando falhou
- schema_name: nome do schema PostgreSQL do tenant
- schema_revision: última migration aplicada no schema
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260107_tenant_status'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar coluna status com enum
    op.add_column('tenants', sa.Column('status', sa.String(20), nullable=True, server_default='pending'))
    
    # Adicionar campos de tracking de provisionamento
    op.add_column('tenants', sa.Column('provisioning_error', sa.Text(), nullable=True))
    op.add_column('tenants', sa.Column('provisioned_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenants', sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True))
    
    # Adicionar campos para tracking de schema
    op.add_column('tenants', sa.Column('schema_name', sa.String(100), nullable=True))
    op.add_column('tenants', sa.Column('schema_revision', sa.String(100), nullable=True))
    
    # Actualizar tenants existentes para status 'ready' (assumindo que estão funcionais)
    op.execute("UPDATE tenants SET status = 'ready' WHERE status IS NULL OR status = 'pending'")
    
    # Preencher schema_name para tenants existentes
    op.execute("UPDATE tenants SET schema_name = 'tenant_' || slug WHERE schema_name IS NULL")
    
    # Criar índice para queries por status
    op.create_index('ix_tenants_status', 'tenants', ['status'])


def downgrade() -> None:
    op.drop_index('ix_tenants_status', table_name='tenants')
    op.drop_column('tenants', 'schema_revision')
    op.drop_column('tenants', 'schema_name')
    op.drop_column('tenants', 'failed_at')
    op.drop_column('tenants', 'provisioned_at')
    op.drop_column('tenants', 'provisioning_error')
    op.drop_column('tenants', 'status')
