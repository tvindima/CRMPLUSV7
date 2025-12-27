from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class LeadStatus(str, PyEnum):
    NEW = "new"  # Nova lead (não contactada)
    CONTACTED = "contacted"  # Já foi contactada
    QUALIFIED = "qualified"  # Lead qualificada (interesse real)
    PROPOSAL_SENT = "proposal_sent"  # Proposta enviada
    VISIT_SCHEDULED = "visit_scheduled"  # Visita agendada
    NEGOTIATION = "negotiation"  # Em negociação
    CONVERTED = "converted"  # Convertida em cliente
    LOST = "lost"  # Perdida


class LeadSource(str, PyEnum):
    WEBSITE = "website"  # Site montra
    PHONE = "phone"  # Telefone
    EMAIL = "email"  # Email direto
    REFERRAL = "referral"  # Indicação
    SOCIAL = "social"  # Redes sociais
    MANUAL = "manual"  # Criada manualmente no backoffice
    OTHER = "other"  # Outra origem


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True, index=True)  # ✅ NULLABLE para leads mobile sem email
    phone = Column(String, nullable=True)
    message = Column(Text, nullable=True)  # Mensagem do cliente (site ou mobile)
    
    # Origem e contexto
    source = Column(Enum(LeadSource), default=LeadSource.MANUAL)
    origin = Column(String, nullable=True)  # URL ou descrição adicional
    
    # Status e atribuição
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)
    assigned_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    
    # Propriedade que gerou a lead (do site montra)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    
    # Tipo de ação que gerou a lead
    action_type = Column(String, nullable=True)  # "info_request", "visit_request", "contact"
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assigned_agent = relationship("Agent", back_populates="leads")
    property = relationship("Property", foreign_keys=[property_id])
    tasks = relationship("Task", back_populates="lead", foreign_keys="Task.lead_id")
    visits = relationship("Visit", back_populates="lead_obj")
    events = relationship("Event", back_populates="lead")
    first_impressions = relationship("FirstImpression", back_populates="lead")
