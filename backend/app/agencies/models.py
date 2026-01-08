from sqlalchemy import Column, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Template personalizado de CMI (JSON com cláusulas editáveis)
    # Estrutura: { "cabecalho": "...", "clausulas": [...], "rodape": "..." }
    cmi_template = Column(JSON, nullable=True)
    
    # Dados da mediadora para o CMI (substituem os defaults)
    mediador_nome = Column(String(255), nullable=True)  # Nome comercial
    mediador_morada = Column(Text, nullable=True)  # Sede social
    mediador_codigo_postal = Column(String(20), nullable=True)
    mediador_nif = Column(String(20), nullable=True)  # NIPC
    mediador_capital_social = Column(String(50), nullable=True)
    mediador_conservatoria = Column(String(255), nullable=True)
    mediador_licenca_ami = Column(String(50), nullable=True)
    
    # Comissões default da agência
    comissao_venda_percentagem = Column(String(10), nullable=True)  # ex: "5%"
    comissao_arrendamento_percentagem = Column(String(10), nullable=True)  # ex: "100%"
    
    teams = relationship("Team", back_populates="agency")
    agents = relationship("Agent", back_populates="agency")
