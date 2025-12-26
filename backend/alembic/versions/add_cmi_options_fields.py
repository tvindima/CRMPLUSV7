"""add cmi options fields

Revision ID: add_cmi_options
Revises: 
Create Date: 2025-12-26

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_cmi_options'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Adicionar campos de opções ao CMI
    op.add_column('contratos_mediacao', sa.Column('imovel_livre_onus', sa.Boolean(), server_default='true', nullable=True))
    op.add_column('contratos_mediacao', sa.Column('imovel_onus_descricao', sa.String(255), nullable=True))
    op.add_column('contratos_mediacao', sa.Column('imovel_onus_valor', sa.DECIMAL(15, 2), nullable=True))
    op.add_column('contratos_mediacao', sa.Column('opcao_pagamento', sa.String(50), server_default='cpcv', nullable=True))
    op.add_column('contratos_mediacao', sa.Column('pagamento_percentagem_cpcv', sa.DECIMAL(5, 2), nullable=True))
    op.add_column('contratos_mediacao', sa.Column('pagamento_percentagem_escritura', sa.DECIMAL(5, 2), nullable=True))

def downgrade():
    op.drop_column('contratos_mediacao', 'pagamento_percentagem_escritura')
    op.drop_column('contratos_mediacao', 'pagamento_percentagem_cpcv')
    op.drop_column('contratos_mediacao', 'opcao_pagamento')
    op.drop_column('contratos_mediacao', 'imovel_onus_valor')
    op.drop_column('contratos_mediacao', 'imovel_onus_descricao')
    op.drop_column('contratos_mediacao', 'imovel_livre_onus')
