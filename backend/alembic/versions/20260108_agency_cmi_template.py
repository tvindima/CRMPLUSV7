"""add cmi_template to agencies

Revision ID: 20260108_cmi_template
Revises: 6a57cdd71c97
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_cmi_template'
down_revision = '6a57cdd71c97'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if column exists in table."""
    try:
        bind = op.get_bind()
        inspector = sa.inspect(bind)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns
    except:
        return False


def upgrade():
    # Adicionar campos de template CMI à tabela agencies
    if not column_exists('agencies', 'cmi_template'):
        op.add_column('agencies', sa.Column('cmi_template', sa.JSON(), nullable=True))
    
    if not column_exists('agencies', 'mediador_nome'):
        op.add_column('agencies', sa.Column('mediador_nome', sa.String(255), nullable=True))
    
    if not column_exists('agencies', 'mediador_morada'):
        op.add_column('agencies', sa.Column('mediador_morada', sa.Text(), nullable=True))
    
    if not column_exists('agencies', 'mediador_codigo_postal'):
        op.add_column('agencies', sa.Column('mediador_codigo_postal', sa.String(20), nullable=True))
    
    if not column_exists('agencies', 'mediador_nif'):
        op.add_column('agencies', sa.Column('mediador_nif', sa.String(20), nullable=True))
    
    if not column_exists('agencies', 'mediador_capital_social'):
        op.add_column('agencies', sa.Column('mediador_capital_social', sa.String(50), nullable=True))
    
    if not column_exists('agencies', 'mediador_conservatoria'):
        op.add_column('agencies', sa.Column('mediador_conservatoria', sa.String(255), nullable=True))
    
    if not column_exists('agencies', 'mediador_licenca_ami'):
        op.add_column('agencies', sa.Column('mediador_licenca_ami', sa.String(50), nullable=True))
    
    if not column_exists('agencies', 'comissao_venda_percentagem'):
        op.add_column('agencies', sa.Column('comissao_venda_percentagem', sa.String(10), nullable=True))
    
    if not column_exists('agencies', 'comissao_arrendamento_percentagem'):
        op.add_column('agencies', sa.Column('comissao_arrendamento_percentagem', sa.String(10), nullable=True))


def downgrade():
    op.drop_column('agencies', 'comissao_arrendamento_percentagem')
    op.drop_column('agencies', 'comissao_venda_percentagem')
    op.drop_column('agencies', 'mediador_licenca_ami')
    op.drop_column('agencies', 'mediador_conservatoria')
    op.drop_column('agencies', 'mediador_capital_social')
    op.drop_column('agencies', 'mediador_nif')
    op.drop_column('agencies', 'mediador_codigo_postal')
    op.drop_column('agencies', 'mediador_morada')
    op.drop_column('agencies', 'mediador_nome')
    op.drop_column('agencies', 'cmi_template')
