"""
CRM Settings - Configurações globais da agência
Inclui watermark, branding, e outras configurações administrativas
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class CRMSettings(Base):
    """
    Configurações globais do CRM para a agência.
    Apenas 1 registo deve existir (singleton pattern).
    """
    __tablename__ = "crm_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # ==========================================
    # WATERMARK / MARCA DE ÁGUA
    # ==========================================
    watermark_enabled = Column(Integer, default=1)  # 1=ativo, 0=desativado
    watermark_image_url = Column(String, nullable=True)  # URL Cloudinary do PNG
    watermark_public_id = Column(String, nullable=True)  # Public ID do Cloudinary para overlay (ex: crm-plus/watermarks/tenant_slug/watermark)
    watermark_opacity = Column(Float, default=0.6)  # 0.0 a 1.0 (60% default)
    watermark_scale = Column(Float, default=0.15)  # 15% da largura da imagem
    watermark_position = Column(String, default="bottom-right")  # bottom-right, bottom-left, top-right, top-left, center
    
    # ==========================================
    # BRANDING & TEMA
    # ==========================================
    agency_name = Column(String, default="CRM Plus")
    agency_logo_url = Column(String, nullable=True)
    agency_slogan = Column(String, default="Powered by CRM Plus")
    
    # Cores do Tema
    primary_color = Column(String, default="#E10600")  # Cor principal (botões, links)
    secondary_color = Column(String, default="#C5C5C5")  # Cor secundária (texto)
    background_color = Column(String, default="#0B0B0D")  # Fundo principal
    background_secondary = Column(String, default="#1A1A1F")  # Fundo cards/secções
    text_color = Column(String, default="#FFFFFF")  # Texto principal
    text_muted = Column(String, default="#9CA3AF")  # Texto secundário
    border_color = Column(String, default="#2A2A2E")  # Bordas
    accent_color = Column(String, default="#E10600")  # Destaques/hover
    
    # ==========================================
    # LIMITES DE UPLOAD
    # ==========================================
    max_photos_per_property = Column(Integer, default=30)
    max_video_size_mb = Column(Integer, default=100)
    max_image_size_mb = Column(Integer, default=20)
    
    # ==========================================
    # METADATA
    # ==========================================
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<CRMSettings id={self.id} watermark={self.watermark_enabled}>"
