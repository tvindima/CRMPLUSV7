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
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '20260107_tenant_status'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Verifica se uma coluna existe numa tabela."""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def index_exists(table_name: str, index_name: str) -> bool:
    """Verifica se um índice existe."""
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
    return index_name in indexes


def upgrade() -> None:
    # Adicionar coluna status com enum (se não existir)
    if not column_exists('tenants', 'status'):
        op.add_column('tenants', sa.Column('status', sa.String(20), nullable=True, server_default='pending'))
    
    # Adicionar campos de tracking de provisionamento
    if not column_exists('tenants', 'provisioning_error'):
        op.add_column('tenants', sa.Column('provisioning_error', sa.Text(), nullable=True))
    if not column_exists('tenants', 'provisioned_at'):
        op.add_column('tenants', sa.Column('provisioned_at', sa.DateTime(timezone=True), nullable=True))
    if not column_exists('tenants', 'failed_at'):
        op.add_column('tenants', sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True))
    
    # Adicionar campos para tracking de schema
    if not column_exists('tenants', 'schema_name'):
        op.add_column('tenants', sa.Column('schema_name', sa.String(100), nullable=True))
    if not column_exists('tenants', 'schema_revision'):
        op.add_column('tenants', sa.Column('schema_revision', sa.String(100), nullable=True))
    
    # Actualizar tenants existentes para status 'ready' (assumindo que estão funcionais)
    op.execute("UPDATE tenants SET status = 'ready' WHERE status IS NULL OR status = 'pending'")
    
    # Preencher schema_name para tenants existentes
    op.execute("UPDATE tenants SET schema_name = 'tenant_' || slug WHERE schema_name IS NULL")
    
    # Criar índice para queries por status (se não existir)
    if not index_exists('tenants', 'ix_tenants_status'):
        op.create_index('ix_tenants_status', 'tenants', ['status'])


def downgrade() -> None:
    op.drop_index('ix_tenants_status', table_name='tenants')
    op.drop_column('tenants', 'schema_revision')
    op.drop_column('tenants', 'schema_name')
    op.drop_column('tenants', 'failed_at')
    op.drop_column('tenants', 'provisioned_at')
    op.drop_column('tenants', 'provisioning_error')
    op.drop_column('tenants', 'status')
