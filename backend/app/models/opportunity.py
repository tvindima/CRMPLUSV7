"""
Modelo SQLAlchemy para Oportunidade
Representa uma oportunidade de negócio entre um lead e um imóvel
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base
import enum


class OpportunityStatus(str, enum.Enum):
    """Estados de uma oportunidade"""
    NEW = "new"                      # Nova oportunidade
    CONTACTED = "contacted"          # Lead contactado
    VISIT_SCHEDULED = "visit_scheduled"  # Visita agendada
    VISITED = "visited"              # Visita realizada
    NEGOTIATING = "negotiating"      # Em negociação
    PROPOSAL_SENT = "proposal_sent"  # Proposta enviada
    ACCEPTED = "accepted"            # Proposta aceite
    REJECTED = "rejected"            # Proposta rejeitada
    LOST = "lost"                    # Oportunidade perdida
    WON = "won"                      # Negócio fechado


class Opportunity(Base):
    """
    Oportunidade - Liga um lead a um imóvel com potencial de negócio
    
    Representa o pipeline de vendas do agente.
    Uma oportunidade pode gerar múltiplas propostas.
    """
    
    __tablename__ = "opportunities"
    
    # === IDs & Relationships ===
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    agency_id = Column(Integer, nullable=True, index=True)
    
    # Relações principais
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # === Dados da Oportunidade ===
    title = Column(String(255), nullable=True)  # Ex: "João Silva - T3 Cascais"
    status = Column(String(50), default="new", index=True)
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    
    # === Valores ===
    estimated_value = Column(Numeric(12, 2), nullable=True)  # Valor estimado do negócio
    proposed_value = Column(Numeric(12, 2), nullable=True)   # Último valor proposto
    commission_percentage = Column(Numeric(5, 2), nullable=True)  # % comissão esperada
    expected_commission = Column(Numeric(10, 2), nullable=True)   # Valor comissão esperada
    
    # === Datas ===
    expected_close_date = Column(DateTime, nullable=True)  # Data prevista de fecho
    last_contact_date = Column(DateTime, nullable=True)    # Último contacto
    next_action_date = Column(DateTime, nullable=True)     # Próxima ação
    
    # === Notas e Histórico ===
    notes = Column(Text, nullable=True)
    next_action = Column(String(255), nullable=True)  # Ex: "Agendar segunda visita"
    loss_reason = Column(String(255), nullable=True)  # Se perdida, porquê
    
    # === Metadata ===
    source = Column(String(100), nullable=True)  # Origem: portal, referral, website, etc.
    tags = Column(JSON, default=list)
    custom_fields = Column(JSON, default=dict)
    
    # === Timestamps ===
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    closed_at = Column(DateTime, nullable=True)  # Quando foi fechada (ganha ou perdida)
    
    # === Relationships ===
    # lead = relationship("Lead", back_populates="opportunities")
    # property = relationship("Property", back_populates="opportunities")
    # proposals = relationship("Proposal", back_populates="opportunity", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Opportunity {self.id}: {self.title or 'Sem título'} ({self.status})>"
