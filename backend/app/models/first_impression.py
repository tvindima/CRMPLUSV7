"""
Modelo SQLAlchemy para First Impressions (Primeiras Impressões)
"""
from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base


class FirstImpression(Base):
    """
    First Impression - Primeira Impressão de Imóvel
    
    Documento gerado pelo agente com:
    - Dados CMI (Caderneta Predial)
    - Dados do Cliente
    - Assinatura Digital
    - PDF final
    """
    
    __tablename__ = "first_impressions"
    
    # === IDs & Relationships ===
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # === Dados CMI (Caderneta Predial) ===
    artigo_matricial = Column(String(50), nullable=True)
    freguesia = Column(String(255), nullable=True)
    concelho = Column(String(255), nullable=True)
    distrito = Column(String(255), nullable=True)
    area_bruta = Column(DECIMAL(10, 2), nullable=True)  # m²
    area_util = Column(DECIMAL(10, 2), nullable=True)  # m²
    tipologia = Column(String(50), nullable=True)  # Ex: T3, T2, T4
    ano_construcao = Column(Integer, nullable=True)
    valor_patrimonial = Column(DECIMAL(15, 2), nullable=True)  # €
    
    # === Dados do Cliente ===
    client_name = Column(String(255), nullable=True)  # ✅ Opcional - pode ser preenchido depois por OCR
    client_nif = Column(String(20), nullable=True, index=True)
    client_phone = Column(String(50), nullable=True)  # ✅ Opcional
    client_email = Column(String(255), nullable=True)  # ✅ Opcional
    referred_by = Column(String(255), nullable=True)  # ✅ Quem indicou
    
    # === Localização GPS ===
    latitude = Column(DECIMAL(10, 7), nullable=True)  # GPS latitude
    longitude = Column(DECIMAL(10, 7), nullable=True)  # GPS longitude
    location = Column(String(500), nullable=True)  # Morada texto
    
    # === Campos Adicionais CMI ===
    estado_conservacao = Column(String(100), nullable=True)  # Ex: Bom, Razoável
    valor_estimado = Column(DECIMAL(15, 2), nullable=True)  # Valor estimado €
    
    # === Observações ===
    observations = Column(Text, nullable=True)
    
    # === Assinatura Digital ===
    signature_image = Column(Text, nullable=True)  # base64 encoded PNG
    signature_date = Column(DateTime(timezone=True), nullable=True)
    
    # === Fotos & Anexos ===
    photos = Column(JSON, nullable=True)  # Array URLs: ['url1', 'url2']
    attachments = Column(JSON, nullable=True)  # Array: [{'name': 'file.pdf', 'url': 'url'}]
    
    # === PDF Gerado ===
    pdf_url = Column(String(500), nullable=True)
    pdf_generated_at = Column(DateTime(timezone=True), nullable=True)
    
    # === Status & Metadata ===
    status = Column(
        String(50),
        nullable=False,
        server_default='draft',
        index=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # === Constraint: Status válido ===
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'signed', 'completed', 'cancelled')",
            name='check_first_impressions_status'
        ),
    )
    
    # === Relationships ===
    agent = relationship("Agent", back_populates="first_impressions")
    property = relationship("Property", back_populates="first_impressions")
    lead = relationship("Lead", back_populates="first_impressions")
    
    def __repr__(self):
        return f"<FirstImpression(id={self.id}, client={self.client_name}, status={self.status})>"
    
    def to_dict(self):
        """Converter para dicionário (útil para JSON)"""
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'property_id': self.property_id,
            'lead_id': self.lead_id,
            'artigo_matricial': self.artigo_matricial,
            'freguesia': self.freguesia,
            'concelho': self.concelho,
            'distrito': self.distrito,
            'area_bruta': float(self.area_bruta) if self.area_bruta else None,
            'area_util': float(self.area_util) if self.area_util else None,
            'tipologia': self.tipologia,
            'ano_construcao': self.ano_construcao,
            'valor_patrimonial': float(self.valor_patrimonial) if self.valor_patrimonial else None,
            'client_name': self.client_name,
            'client_nif': self.client_nif,
            'client_phone': self.client_phone,
            'client_email': self.client_email,
            'observations': self.observations,
            'signature_image': self.signature_image,
            'signature_date': self.signature_date.isoformat() if self.signature_date else None,
            'pdf_url': self.pdf_url,
            'pdf_generated_at': self.pdf_generated_at.isoformat() if self.pdf_generated_at else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
