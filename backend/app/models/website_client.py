"""
Modelos para clientes do website (compradores/interessados)
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
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
