"""Add platform tables - tenants, super_admins, platform_settings

Revision ID: 20260107_platform
Revises: None
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers
revision = '20260107_platform'
down_revision = None
branch_labels = None
depends_on = None


def table_exists(table_name):
    """Check if a table exists"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade():
    """
    Criar tabelas da plataforma:
    - tenants: registo de imobiliárias/empresas
    - super_admins: administradores da plataforma
    - platform_settings: configurações globais
    """
    
    # ==========================================
    # TENANTS TABLE
    # ==========================================
    if not table_exists('tenants'):
        op.create_table(
            'tenants',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('slug', sa.String(50), unique=True, nullable=False, index=True),
            sa.Column('name', sa.String(200), nullable=False),
            sa.Column('email', sa.String(200), nullable=True),
            sa.Column('phone', sa.String(50), nullable=True),
            sa.Column('primary_domain', sa.String(200), nullable=True),
            sa.Column('backoffice_domain', sa.String(200), nullable=True),
            sa.Column('api_subdomain', sa.String(200), nullable=True),
            sa.Column('database_url', sa.Text(), nullable=True),
            sa.Column('plan', sa.String(50), server_default='basic'),
            sa.Column('features', sa.JSON(), server_default='{}'),
            sa.Column('max_agents', sa.Integer(), server_default='10'),
            sa.Column('max_properties', sa.Integer(), server_default='100'),
            sa.Column('is_active', sa.Boolean(), server_default='true'),
            sa.Column('is_trial', sa.Boolean(), server_default='false'),
            sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('logo_url', sa.String(500), nullable=True),
            sa.Column('primary_color', sa.String(20), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        )
        print("✅ Table 'tenants' created")
        
        # Inserir tenant default (Imóveis Mais)
        op.execute("""
            INSERT INTO tenants (slug, name, email, primary_domain, backoffice_domain, plan, max_agents, max_properties)
            VALUES (
                'imoveismais',
                'Imóveis Mais',
                'geral@imoveismais.com',
                'imoveismais.com',
                'backoffice.imoveismais.com',
                'enterprise',
                50,
                1000
            )
        """)
        print("✅ Default tenant 'imoveismais' inserted")
    else:
        print("⏭️ Table 'tenants' already exists, skipping")
    
    # ==========================================
    # SUPER ADMINS TABLE
    # ==========================================
    if not table_exists('super_admins'):
        op.create_table(
            'super_admins',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('email', sa.String(200), unique=True, nullable=False, index=True),
            sa.Column('password_hash', sa.String(200), nullable=False),
            sa.Column('name', sa.String(200), nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default='true'),
            sa.Column('permissions', sa.JSON(), server_default='{}'),
            sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        )
        print("✅ Table 'super_admins' created")
    else:
        print("⏭️ Table 'super_admins' already exists, skipping")
    
    # ==========================================
    # PLATFORM SETTINGS TABLE
    # ==========================================
    if not table_exists('platform_settings'):
        op.create_table(
            'platform_settings',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('platform_name', sa.String(100), server_default='CRM Plus'),
            sa.Column('platform_logo_url', sa.String(500), nullable=True),
            sa.Column('support_email', sa.String(200), server_default='suporte@crmplus.pt'),
            sa.Column('default_plan', sa.String(50), server_default='basic'),
            sa.Column('trial_days', sa.Integer(), server_default='14'),
            sa.Column('maintenance_mode', sa.Boolean(), server_default='false'),
            sa.Column('registration_enabled', sa.Boolean(), server_default='true'),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        )
        print("✅ Table 'platform_settings' created")
        
        # Inserir configurações default
        op.execute("""
            INSERT INTO platform_settings (platform_name, support_email, default_plan, trial_days)
            VALUES ('CRM Plus', 'suporte@crmplus.pt', 'basic', 14)
        """)
        print("✅ Default platform settings inserted")
    else:
        print("⏭️ Table 'platform_settings' already exists, skipping")


def downgrade():
    """Remove platform tables"""
    op.drop_table('platform_settings')
    op.drop_table('super_admins')
    op.drop_table('tenants')
