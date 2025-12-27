from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class UserRole(str, PyEnum):
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    AGENT = "agent"
    ASSISTANT = "assistant"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserRole.AGENT.value)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role_label = Column(String, nullable=True)  # Label customizado para exibição (ex: "Diretora Financeira")
    
    # Relacionamento com Agent (opcional - um User pode ser um Agent)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    agent = relationship("Agent", foreign_keys=[agent_id])
    
    # Para assistentes: ID do agente para quem trabalham
    # Quando o assistente faz login, a app mobile carrega os dados deste agente
    works_for_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    works_for_agent = relationship("Agent", foreign_keys=[works_for_agent_id])
    
    # Relacionamento com Refresh Tokens
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
