"""
Modelo SQLAlchemy para Cliente
Base de dados de clientes por agente com sincronização para agência
"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base
import enum


class ClientType(str, enum.Enum):
    """Tipos de cliente"""
    VENDEDOR = "vendedor"
    COMPRADOR = "comprador"
    INVESTIDOR = "investidor"
    ARRENDATARIO = "arrendatario"
    SENHORIO = "senhorio"
    LEAD = "lead"


class ClientOrigin(str, enum.Enum):
    """Origem do cliente"""
    ANGARIACAO = "angariacao"      # Criado via angariação/CMI
    PRE_ANGARIACAO = "pre_angariacao"
    MANUAL = "manual"              # Adicionado manualmente pelo agente
    REFERENCIA = "referencia"      # Referência de outro cliente
    PORTAL = "portal"              # Lead de portal imobiliário
    WEBSITE = "website"            # Lead do website


class Client(Base):
    """
    Cliente - Base de dados de clientes por agente
    
    Cada cliente pertence a um agente, mas a agência tem visibilidade de todos.
    Clientes podem ser criados automaticamente (via CMI/OCR) ou manualmente.
    """
    
    __tablename__ = "clients"
    
    # === IDs & Relationships ===
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    agency_id = Column(Integer, nullable=True, index=True)  # Para filtros rápidos por agência
    
    # Relações com outras entidades (opcional)
    angariacao_id = Column(Integer, ForeignKey("pre_angariacoes.id", ondelete="SET NULL"), nullable=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    
    # === Classificação ===
    client_type = Column(String(50), default="lead", index=True)  # vendedor, comprador, investidor, etc.
    origin = Column(String(50), default="manual")  # angariacao, manual, portal, etc.
    
    # === Dados Pessoais ===
    nome = Column(String(255), nullable=False, index=True)
    nif = Column(String(20), nullable=True, index=True)
    cc = Column(String(30), nullable=True)  # Número do Cartão de Cidadão
    cc_validade = Column(Date, nullable=True)
    data_nascimento = Column(Date, nullable=True)
    nacionalidade = Column(String(100), nullable=True)
    estado_civil = Column(String(50), nullable=True)
    profissao = Column(String(255), nullable=True)
    
    # === Contactos ===
    email = Column(String(255), nullable=True, index=True)
    telefone = Column(String(50), nullable=True, index=True)
    telefone_alt = Column(String(50), nullable=True)
    
    # === Morada ===
    morada = Column(String(500), nullable=True)
    codigo_postal = Column(String(20), nullable=True)
    localidade = Column(String(255), nullable=True)
    distrito = Column(String(100), nullable=True)
    
    # === CRM / Notas ===
    notas = Column(Text, nullable=True)  # Notas do agente sobre o cliente
    tags = Column(JSON, default=list)    # Tags para organização: ["VIP", "Urgente", etc.]
    
    # === Tracking ===
    ultima_interacao = Column(DateTime(timezone=True), nullable=True)
    proxima_acao = Column(String(500), nullable=True)
    proxima_acao_data = Column(DateTime(timezone=True), nullable=True)
    
    # === Metadata ===
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # === Relationships ===
    agent = relationship("Agent", backref="clients")
    angariacao = relationship("PreAngariacao", backref="clientes")
    property = relationship("Property", backref="clientes")
    
    def __repr__(self):
        return f"<Client(id={self.id}, nome='{self.nome}', type='{self.client_type}', agent_id={self.agent_id})>"
    
    def to_dict(self):
        """Converter para dicionário para API responses"""
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "agency_id": self.agency_id,
            "client_type": self.client_type,
            "origin": self.origin,
            # Dados pessoais
            "nome": self.nome,
            "nif": self.nif,
            "cc": self.cc,
            "cc_validade": self.cc_validade.isoformat() if self.cc_validade else None,
            "data_nascimento": self.data_nascimento.isoformat() if self.data_nascimento else None,
            "nacionalidade": self.nacionalidade,
            "estado_civil": self.estado_civil,
            "profissao": self.profissao,
            # Contactos
            "email": self.email,
            "telefone": self.telefone,
            "telefone_alt": self.telefone_alt,
            # Morada
            "morada": self.morada,
            "codigo_postal": self.codigo_postal,
            "localidade": self.localidade,
            "distrito": self.distrito,
            # CRM
            "notas": self.notas,
            "tags": self.tags or [],
            "ultima_interacao": self.ultima_interacao.isoformat() if self.ultima_interacao else None,
            "proxima_acao": self.proxima_acao,
            "proxima_acao_data": self.proxima_acao_data.isoformat() if self.proxima_acao_data else None,
            # Relações
            "angariacao_id": self.angariacao_id,
            "property_id": self.property_id,
            "lead_id": self.lead_id,
            # Meta
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
