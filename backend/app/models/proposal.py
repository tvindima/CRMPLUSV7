"""
Modelo SQLAlchemy para Proposta
Representa uma proposta formal de compra/venda/arrendamento
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Numeric, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base
import enum


class ProposalStatus(str, enum.Enum):
    """Estados de uma proposta"""
    DRAFT = "draft"              # Rascunho
    PENDING_REVIEW = "pending_review"  # A aguardar revisão interna
    SENT = "sent"                # Enviada ao cliente
    UNDER_ANALYSIS = "under_analysis"  # Cliente a analisar
    COUNTER_OFFER = "counter_offer"    # Contraproposta recebida
    ACCEPTED = "accepted"        # Aceite
    REJECTED = "rejected"        # Rejeitada
    EXPIRED = "expired"          # Expirada
    WITHDRAWN = "withdrawn"      # Retirada


class ProposalType(str, enum.Enum):
    """Tipos de proposta"""
    PURCHASE = "purchase"        # Proposta de compra
    SALE = "sale"                # Proposta de venda
    RENTAL = "rental"            # Proposta de arrendamento
    LEASE = "lease"              # Proposta de leasing


class Proposal(Base):
    """
    Proposta - Documento formal de proposta de negócio
    
    Uma proposta está sempre associada a uma oportunidade.
    Pode haver múltiplas propostas para a mesma oportunidade (negociação).
    """
    
    __tablename__ = "proposals"
    
    # === IDs & Relationships ===
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    agency_id = Column(Integer, nullable=True, index=True)
    
    # Relações
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    
    # === Dados da Proposta ===
    proposal_number = Column(String(50), unique=True, index=True)  # Ex: PROP-2026-0001
    proposal_type = Column(String(50), default="purchase")
    status = Column(String(50), default="draft", index=True)
    version = Column(Integer, default=1)  # Para tracking de revisões
    
    # === Valores ===
    proposed_value = Column(Numeric(12, 2), nullable=False)  # Valor proposto
    deposit_value = Column(Numeric(12, 2), nullable=True)    # Valor do sinal/entrada
    deposit_percentage = Column(Numeric(5, 2), nullable=True)  # % do sinal
    
    # Comissão
    commission_percentage = Column(Numeric(5, 2), nullable=True)
    commission_value = Column(Numeric(10, 2), nullable=True)
    commission_split = Column(JSON, default=dict)  # Se partilha com outros agentes
    
    # === Condições ===
    conditions = Column(Text, nullable=True)  # Condições da proposta
    financing_type = Column(String(50), nullable=True)  # cash, mortgage, mixed
    financing_bank = Column(String(100), nullable=True)
    financing_approved = Column(Boolean, nullable=True)
    financing_amount = Column(Numeric(12, 2), nullable=True)
    
    # === Datas ===
    valid_until = Column(Date, nullable=True)  # Validade da proposta
    cpcv_date = Column(Date, nullable=True)    # Data prevista CPCV
    deed_date = Column(Date, nullable=True)    # Data prevista escritura
    
    # === Documentos ===
    pdf_url = Column(String(500), nullable=True)
    signed_pdf_url = Column(String(500), nullable=True)
    attachments = Column(JSON, default=list)
    
    # === Assinaturas ===
    client_signature = Column(Text, nullable=True)  # Base64 ou URL
    client_signed_at = Column(DateTime, nullable=True)
    agent_signature = Column(Text, nullable=True)
    agent_signed_at = Column(DateTime, nullable=True)
    
    # === Notas ===
    internal_notes = Column(Text, nullable=True)  # Notas internas (não vai ao cliente)
    client_notes = Column(Text, nullable=True)    # Notas do cliente/feedback
    rejection_reason = Column(String(500), nullable=True)
    
    # === Contraproposta ===
    is_counter_offer = Column(Boolean, default=False)
    parent_proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=True)
    counter_offer_value = Column(Numeric(12, 2), nullable=True)
    
    # === Metadata ===
    tags = Column(JSON, default=list)
    custom_fields = Column(JSON, default=dict)
    
    # === Timestamps ===
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    sent_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    
    # === Relationships ===
    # opportunity = relationship("Opportunity", back_populates="proposals")
    # parent_proposal = relationship("Proposal", remote_side=[id])
    
    def __repr__(self):
        return f"<Proposal {self.proposal_number}: {self.proposed_value}€ ({self.status})>"
