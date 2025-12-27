"""
Modelos para clientes do website (compradores/interessados)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class WebsiteClient(Base):
    """Cliente registado no site montra (comprador/interessado)"""
    __tablename__ = "website_clients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Dados básicos
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    
    # Tipo de cliente e interesse
    client_type = Column(String, default="pontual")  # "investidor", "pontual", "arrendamento"
    interest_type = Column(String, default="compra")  # "compra", "arrendamento"
    
    # Agente atribuído
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    agent_selected_by_client = Column(Boolean, default=False)  # True se cliente escolheu o agente
    
    # Estado da conta
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Email verificado
    
    # Preferências
    receive_alerts = Column(Boolean, default=True)  # Receber alertas de novos imóveis
    search_preferences = Column(Text, nullable=True)  # JSON com preferências de pesquisa
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class LeadDistributionCounter(Base):
    """Contadores para distribuição round-robin de leads"""
    __tablename__ = "lead_distribution_counters"
    
    id = Column(Integer, primary_key=True, index=True)
    counter_type = Column(String, unique=True, nullable=False)  # "investidor", "pontual"
    last_agent_index = Column(Integer, default=0)  # Índice do último agente que recebeu lead
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
