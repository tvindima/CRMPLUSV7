"""Create website_clients table for site authentication

Revision ID: 20251227_website_clients
Revises: 20251227_message_leads
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251227_website_clients'
down_revision = '20251227_message_leads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create website_clients table
    op.create_table(
        'website_clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('receive_alerts', sa.Boolean(), default=True),
        sa.Column('search_preferences', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_website_clients_id'), 'website_clients', ['id'], unique=False)
    op.create_index(op.f('ix_website_clients_email'), 'website_clients', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_website_clients_email'), table_name='website_clients')
    op.drop_index(op.f('ix_website_clients_id'), table_name='website_clients')
    op.drop_table('website_clients')
