"""Consolidate all migrations - ensure all tables/columns exist

Revision ID: 20260110_consolidate
Revises: 
Create Date: 2026-01-10

This migration consolidates all tables and columns, ensuring they exist
without failing if they already do.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = '20260110_consolidate'
down_revision = None
branch_labels = ('consolidated',)
depends_on = None


def table_exists(conn, table_name):
    inspector = Inspector.from_engine(conn)
    return table_name in inspector.get_table_names()


def column_exists(conn, table_name, column_name):
    inspector = Inspector.from_engine(conn)
    if not table_exists(conn, table_name):
        return False
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    """Ensure all critical tables and columns exist."""
    conn = op.get_bind()
    
    # === AGENTS ===
    if not column_exists(conn, 'agents', 'nif'):
        op.add_column('agents', sa.Column('nif', sa.String(20), nullable=True))
    if not column_exists(conn, 'agents', 'address'):
        op.add_column('agents', sa.Column('address', sa.String(500), nullable=True))
    if not column_exists(conn, 'agents', 'twitter'):
        op.add_column('agents', sa.Column('twitter', sa.String(200), nullable=True))
    if not column_exists(conn, 'agents', 'tiktok'):
        op.add_column('agents', sa.Column('tiktok', sa.String(200), nullable=True))
    if not column_exists(conn, 'agents', 'license_ami'):
        op.add_column('agents', sa.Column('license_ami', sa.String(50), nullable=True))
    
    # === PROPERTIES ===
    if not column_exists(conn, 'properties', 'video_url'):
        op.add_column('properties', sa.Column('video_url', sa.String(500), nullable=True))
    if not column_exists(conn, 'properties', 'hide_address'):
        op.add_column('properties', sa.Column('hide_address', sa.Boolean(), server_default='false'))
    if not column_exists(conn, 'properties', 'show_in_website'):
        op.add_column('properties', sa.Column('show_in_website', sa.Boolean(), server_default='true'))
    if not column_exists(conn, 'properties', 'highlight_website'):
        op.add_column('properties', sa.Column('highlight_website', sa.Boolean(), server_default='false'))
    if not column_exists(conn, 'properties', 'available_date'):
        op.add_column('properties', sa.Column('available_date', sa.Date(), nullable=True))
    
    # === USERS ===
    if not column_exists(conn, 'users', 'role_label'):
        op.add_column('users', sa.Column('role_label', sa.String(100), nullable=True))
    if not column_exists(conn, 'users', 'works_for_agent_id'):
        op.add_column('users', sa.Column('works_for_agent_id', sa.Integer(), nullable=True))
    
    # === LEADS ===
    if not column_exists(conn, 'leads', 'message'):
        op.add_column('leads', sa.Column('message', sa.Text(), nullable=True))
    
    # === FIRST_IMPRESSIONS ===
    if not column_exists(conn, 'first_impressions', 'tipo_imovel'):
        op.add_column('first_impressions', sa.Column('tipo_imovel', sa.String(100), nullable=True))
    if not column_exists(conn, 'first_impressions', 'gps_latitude'):
        op.add_column('first_impressions', sa.Column('gps_latitude', sa.Float(), nullable=True))
    if not column_exists(conn, 'first_impressions', 'gps_longitude'):
        op.add_column('first_impressions', sa.Column('gps_longitude', sa.Float(), nullable=True))
    
    # === PRE_ANGARIACOES ===
    if table_exists(conn, 'pre_angariacoes'):
        if not column_exists(conn, 'pre_angariacoes', 'tipo_imovel'):
            op.add_column('pre_angariacoes', sa.Column('tipo_imovel', sa.String(100), nullable=True))
    
    # === TENANTS (Platform) ===
    if table_exists(conn, 'tenants'):
        cols_to_add = [
            ('secondary_color', sa.String(20)),
            ('sector', sa.String(50)),
            ('admin_email', sa.String(200)),
            ('admin_created', sa.Boolean()),
            ('onboarding_completed', sa.Boolean()),
            ('onboarding_step', sa.Integer()),
            ('custom_domain_verified', sa.Boolean()),
            ('domain_verification_token', sa.String(100)),
            ('stripe_customer_id', sa.String(100)),
            ('stripe_subscription_id', sa.String(100)),
            ('billing_email', sa.String(200)),
            ('provisioning_status', sa.String(50)),
            ('provisioning_error', sa.Text()),
        ]
        for col_name, col_type in cols_to_add:
            if not column_exists(conn, 'tenants', col_name):
                op.add_column('tenants', sa.Column(col_name, col_type, nullable=True))
    
    # === CLIENTS ===
    if table_exists(conn, 'clients'):
        cols_to_add = [
            ('nif', sa.String(20)),
            ('address', sa.Text()),
            ('postal_code', sa.String(20)),
            ('city', sa.String(100)),
            ('occupation', sa.String(200)),
            ('notes', sa.Text()),
            ('date_of_birth', sa.Date()),
        ]
        for col_name, col_type in cols_to_add:
            if not column_exists(conn, 'clients', col_name):
                op.add_column('clients', sa.Column(col_name, col_type, nullable=True))
    
    print("✅ Consolidation migration completed - all columns verified")


def downgrade():
    """No downgrade - this is a consolidation migration."""
    pass
