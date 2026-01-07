"""
Modelo SQLAlchemy para Escrituras
Agendamento de escrituras com dados para faturação
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Escritura(Base):
    """
    Escritura - Agendamento de escrituras com dados financeiros
    
    Permite ao backoffice:
    - Ver escrituras agendadas
    - Preparar documentação atempadamente
    - Emitir faturas com valores corretos
    """
    
    __tablename__ = "escrituras"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # === Referências ===
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    agency_id = Column(Integer, nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    
    # === Data e Local ===
    data_escritura = Column(DateTime(timezone=True), nullable=False, index=True)
    hora_escritura = Column(String(10), nullable=True)  # "10:30"
    local_escritura = Column(String(500), nullable=True)  # Nome do cartório/notário
    morada_cartorio = Column(String(500), nullable=True)
    
    # === Partes Envolvidas ===
    nome_comprador = Column(String(255), nullable=True)
    nif_comprador = Column(String(20), nullable=True)
    nome_vendedor = Column(String(255), nullable=True)
    nif_vendedor = Column(String(20), nullable=True)
    
    # === Valores Financeiros ===
    valor_venda = Column(Numeric(12, 2), nullable=False)  # Valor de venda do imóvel
    valor_comissao = Column(Numeric(10, 2), nullable=True)  # Comissão da agência
    percentagem_comissao = Column(Numeric(5, 2), nullable=True)  # Ex: 5.00 para 5%
    valor_comissao_agente = Column(Numeric(10, 2), nullable=True)  # Parte do agente
    
    # === Estado ===
    status = Column(String(50), default="agendada", index=True)
    # Valores: agendada, confirmada, realizada, cancelada, adiada
    
    # === Documentação ===
    documentacao_pronta = Column(Boolean, default=False)
    notas_documentacao = Column(Text, nullable=True)
    
    # === Faturação ===
    fatura_emitida = Column(Boolean, default=False)
    numero_fatura = Column(String(50), nullable=True)
    data_fatura = Column(DateTime(timezone=True), nullable=True)
    
    # === Notas ===
    notas = Column(Text, nullable=True)
    
    # === Timestamps ===
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, nullable=True)  # ID do user que criou
    
    # === Relacionamentos ===
    property = relationship("Property", foreign_keys=[property_id])
    agent = relationship("Agent", foreign_keys=[agent_id])
    client = relationship("Client", foreign_keys=[client_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "agent_id": self.agent_id,
            "agency_id": self.agency_id,
            "client_id": self.client_id,
            "data_escritura": self.data_escritura.isoformat() if self.data_escritura else None,
            "hora_escritura": self.hora_escritura,
            "local_escritura": self.local_escritura,
            "morada_cartorio": self.morada_cartorio,
            "nome_comprador": self.nome_comprador,
            "nif_comprador": self.nif_comprador,
            "nome_vendedor": self.nome_vendedor,
            "nif_vendedor": self.nif_vendedor,
            "valor_venda": float(self.valor_venda) if self.valor_venda else 0,
            "valor_comissao": float(self.valor_comissao) if self.valor_comissao else 0,
            "percentagem_comissao": float(self.percentagem_comissao) if self.percentagem_comissao else None,
            "valor_comissao_agente": float(self.valor_comissao_agente) if self.valor_comissao_agente else None,
            "status": self.status,
            "documentacao_pronta": self.documentacao_pronta,
            "notas_documentacao": self.notas_documentacao,
            "fatura_emitida": self.fatura_emitida,
            "numero_fatura": self.numero_fatura,
            "data_fatura": self.data_fatura.isoformat() if self.data_fatura else None,
            "notas": self.notas,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
