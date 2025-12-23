"""
Model para preferências do site montra individual do agente
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AgentSitePreferences(Base):
    """
    Preferências de personalização do site montra individual de cada agente.
    Permite customizar tema, cores, bio, redes sociais e imóveis em destaque.
    """
    __tablename__ = "agent_site_preferences"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Tema
    theme = Column(String(20), default="dark")  # 'dark' ou 'light'
    
    # Cores personalizadas (para futuro)
    primary_color = Column(String(7), default="#ef4444")  # Cor de destaque (vermelho)
    secondary_color = Column(String(7), default="#ffffff")  # Cor secundária
    
    # Hero Properties - IDs dos imóveis em destaque (até 3)
    # Para PostgreSQL usamos ARRAY, mas para SQLite usamos String (JSON)
    hero_property_ids_json = Column(Text, default="[]")  # JSON string para compatibilidade
    
    # Bio e Redes Sociais
    bio = Column(Text, nullable=True)
    instagram = Column(String(255), nullable=True)
    facebook = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    twitter = Column(String(255), nullable=True)  # X.com
    tiktok = Column(String(255), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    agent = relationship("Agent", backref="site_preferences")
    
    @property
    def hero_property_ids(self):
        """Converter JSON string para lista de IDs"""
        import json
        if self.hero_property_ids_json:
            try:
                return json.loads(self.hero_property_ids_json)
            except:
                return []
        return []
    
    @hero_property_ids.setter
    def hero_property_ids(self, value):
        """Converter lista de IDs para JSON string"""
        import json
        if value is None:
            self.hero_property_ids_json = "[]"
        else:
            self.hero_property_ids_json = json.dumps(value)
