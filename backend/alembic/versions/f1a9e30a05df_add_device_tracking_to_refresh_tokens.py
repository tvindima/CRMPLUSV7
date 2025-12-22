"""add_device_tracking_to_refresh_tokens

Revision ID: f1a9e30a05df
Revises: 20251218_203000
Create Date: 2025-12-19 16:22:19.590761

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1a9e30a05df'
down_revision = '20251218_203000'
branch_labels = None
depends_on = None


def upgrade():
    # Check if table exists (SQLite local dev may not have it)
    from sqlalchemy import inspect
    conn = op.get_bind()
    inspector = inspect(conn)
    
    if 'refresh_tokens' not in inspector.get_table_names():
        # Create table if doesn't exist (dev environment)
        op.create_table(
            'refresh_tokens',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('token', sa.String(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('device_name', sa.String(100), nullable=True),
            sa.Column('device_type', sa.String(50), nullable=True),
            sa.Column('device_info', sa.Text(), nullable=True),
            sa.Column('ip_address', sa.String(45), nullable=True),
            sa.Column('last_used_at', sa.DateTime(), nullable=True),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.UniqueConstraint('token')
        )
        op.create_index('ix_refresh_tokens_token', 'refresh_tokens', ['token'])
        op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])
    else:
        # Add device tracking columns if table already exists (production Railway)
        # Check if columns already exist to avoid duplicate errors
        columns = [col['name'] for col in inspector.get_columns('refresh_tokens')]
        
        if 'device_name' not in columns:
            op.add_column('refresh_tokens', sa.Column('device_name', sa.String(100), nullable=True))
        if 'device_type' not in columns:
            op.add_column('refresh_tokens', sa.Column('device_type', sa.String(50), nullable=True))
        if 'device_info' not in columns:
            op.add_column('refresh_tokens', sa.Column('device_info', sa.Text(), nullable=True))
        if 'ip_address' not in columns:
            op.add_column('refresh_tokens', sa.Column('ip_address', sa.String(45), nullable=True))
        if 'last_used_at' not in columns:
            op.add_column('refresh_tokens', sa.Column('last_used_at', sa.DateTime(), nullable=True))


def downgrade():
    # Remove device tracking columns
    op.drop_column('refresh_tokens', 'last_used_at')
    op.drop_column('refresh_tokens', 'ip_address')
    op.drop_column('refresh_tokens', 'device_info')
    op.drop_column('refresh_tokens', 'device_type')
    op.drop_column('refresh_tokens', 'device_name')
