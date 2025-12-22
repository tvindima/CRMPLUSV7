"""add_refresh_tokens_table

Revision ID: 20251218_203000
Revises: 20251218_155904
Create Date: 2024-12-18 20:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from datetime import datetime


# revision identifiers, used by Alembic.
revision = '20251218_203000'
down_revision = '20251218_155904'
branch_labels = None
depends_on = None


def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    """Criar tabela refresh_tokens para sessões persistentes"""
    # Skip if users table doesn't exist
    if not table_exists('users'):
        print("[MIGRATION] Skipping - users table does not exist yet")
        return
    
    # Skip if already exists
    if table_exists('refresh_tokens'):
        print("[MIGRATION] Skipping - refresh_tokens table already exists")
        return
    
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('device_info', sa.String(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    # Índices para performance
    op.create_index('ix_refresh_tokens_id', 'refresh_tokens', ['id'])
    op.create_index('ix_refresh_tokens_token', 'refresh_tokens', ['token'], unique=True)
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])
    print("[MIGRATION] 20251218_203000 refresh_tokens created")


def downgrade():
    """Remover tabela refresh_tokens"""
    if table_exists('refresh_tokens'):
        op.drop_index('ix_refresh_tokens_expires_at', table_name='refresh_tokens')
        op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
        op.drop_index('ix_refresh_tokens_token', table_name='refresh_tokens')
        op.drop_index('ix_refresh_tokens_id', table_name='refresh_tokens')
        op.drop_table('refresh_tokens')
