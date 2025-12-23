"""
Modelo SQLAlchemy para Pré-Angariação
Pasta virtual que agrega todo o processo de angariação de um imóvel
"""
from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base


class PreAngariacaoStatus:
    """Estados possíveis da pré-angariação"""
    INICIAL = "inicial"           # Apenas 1ª Impressão criada
    EM_PROGRESSO = "em_progresso" # Documentação em curso
    DOCUMENTOS_OK = "docs_ok"     # Toda documentação pronta
    FOTOS_OK = "fotos_ok"         # Fotos do imóvel prontas
    CONTRATO_OK = "contrato_ok"   # Contrato mediação assinado
    COMPLETO = "completo"         # Tudo pronto para ativar
    ACTIVADO = "activado"         # Convertido em imóvel ativo
    CANCELADO = "cancelado"       # Processo cancelado


class PreAngariacao(Base):
    """
    Pré-Angariação - Pasta/Dossier de Angariação
    
    Agrega todo o processo desde a 1ª Impressão até o imóvel
    estar pronto para venda:
    - First Impression inicial
    - Documentos necessários
    - Fotos do imóvel  
    - Contrato de mediação
    - Checklist de tarefas
    """
    
    __tablename__ = "pre_angariacoes"
    
    # === IDs & Relationships ===
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    first_impression_id = Column(Integer, ForeignKey("first_impressions.id", ondelete="SET NULL"), nullable=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True, index=True)  # Quando convertido
    
    # === Dados Básicos (copiados/derivados da 1ª Impressão) ===
    referencia_interna = Column(String(50), nullable=True, unique=True, index=True)  # PA-2024-001
    
    # Dados do Proprietário
    proprietario_nome = Column(String(255), nullable=False)
    proprietario_nif = Column(String(20), nullable=True)
    proprietario_telefone = Column(String(50), nullable=True)
    proprietario_email = Column(String(255), nullable=True)
    
    # Dados do Imóvel
    morada = Column(String(500), nullable=True)
    codigo_postal = Column(String(20), nullable=True)
    freguesia = Column(String(255), nullable=True)
    concelho = Column(String(255), nullable=True)
    distrito = Column(String(255), nullable=True)
    latitude = Column(DECIMAL(10, 7), nullable=True)
    longitude = Column(DECIMAL(10, 7), nullable=True)
    
    # Características
    tipologia = Column(String(50), nullable=True)  # T0, T1, T2...
    area_bruta = Column(DECIMAL(10, 2), nullable=True)
    area_util = Column(DECIMAL(10, 2), nullable=True)
    ano_construcao = Column(Integer, nullable=True)
    estado_conservacao = Column(String(100), nullable=True)
    
    # Valores
    valor_pretendido = Column(DECIMAL(15, 2), nullable=True)  # Valor que o proprietário quer
    valor_avaliacao = Column(DECIMAL(15, 2), nullable=True)   # Valor da avaliação
    valor_final = Column(DECIMAL(15, 2), nullable=True)       # Valor acordado para venda
    
    # === Documentos (JSON array) ===
    # Cada doc: {type, name, url, uploaded_at, status}
    documentos = Column(JSON, default=list)
    """
    Tipos de documentos:
    - caderneta_predial: Caderneta Predial Urbana
    - certidao_permanente: Certidão Permanente do Registo Predial
    - licenca_utilizacao: Licença de Utilização
    - ficha_tecnica: Ficha Técnica da Habitação
    - certificado_energetico: Certificado Energético
    - planta_imovel: Planta do Imóvel
    - contrato_mediacao: Contrato de Mediação Imobiliária
    - documentos_proprietario: CC/BI do Proprietário
    - comprovativo_iban: Comprovativo IBAN
    - outro: Outros documentos
    """
    
    # === Fotos do Imóvel (JSON array) ===
    # Cada foto: {url, caption, room_type, order, uploaded_at}
    fotos = Column(JSON, default=list)
    
    # === Checklist de Tarefas (JSON array) ===
    # Cada item: {id, title, completed, completed_at, notes}
    checklist = Column(JSON, default=list)
    """
    Checklist padrão:
    - first_impression: 1ª Impressão assinada
    - caderneta: Caderneta predial obtida
    - certidao: Certidão permanente obtida
    - licenca: Licença de utilização
    - certificado_energetico: Certificado energético
    - fotos: Fotos profissionais tiradas
    - contrato: Contrato de mediação assinado
    - avaliacao: Avaliação do imóvel feita
    - documentos_proprietario: Documentos do proprietário
    """
    
    # === Notas e Observações ===
    notas = Column(Text, nullable=True)
    
    # === Status & Progresso ===
    status = Column(String(50), default=PreAngariacaoStatus.INICIAL, nullable=False, index=True)
    progresso = Column(Integer, default=0)  # 0-100%
    
    # === Datas Importantes ===
    data_primeira_visita = Column(DateTime(timezone=True), nullable=True)
    data_contrato = Column(DateTime(timezone=True), nullable=True)  # Data assinatura contrato
    data_activacao = Column(DateTime(timezone=True), nullable=True)  # Quando foi convertido em imóvel
    
    # === Metadata ===
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # === Relationships ===
    agent = relationship("Agent", backref="pre_angariacoes")
    first_impression = relationship("FirstImpression", backref="pre_angariacao", uselist=False)
    property = relationship("Property", backref="pre_angariacao", uselist=False)
    
    def __repr__(self):
        return f"<PreAngariacao(id={self.id}, ref={self.referencia_interna}, status={self.status})>"
    
    def calcular_progresso(self):
        """Calcular percentagem de progresso baseado no checklist"""
        if not self.checklist:
            return 0
        
        total = len(self.checklist)
        completos = sum(1 for item in self.checklist if item.get('completed', False))
        return int((completos / total) * 100) if total > 0 else 0
    
    def atualizar_status(self):
        """Atualizar status baseado nos documentos e checklist"""
        progresso = self.calcular_progresso()
        self.progresso = progresso
        
        # Verificar documentos obrigatórios
        docs_types = [d.get('type') for d in (self.documentos or [])]
        has_contrato = 'contrato_mediacao' in docs_types
        has_fotos = len(self.fotos or []) >= 5  # Mínimo 5 fotos
        
        if progresso == 100 and has_contrato and has_fotos:
            self.status = PreAngariacaoStatus.COMPLETO
        elif has_contrato:
            self.status = PreAngariacaoStatus.CONTRATO_OK
        elif has_fotos:
            self.status = PreAngariacaoStatus.FOTOS_OK
        elif progresso >= 50:
            self.status = PreAngariacaoStatus.DOCUMENTOS_OK
        elif progresso > 0:
            self.status = PreAngariacaoStatus.EM_PROGRESSO
        else:
            self.status = PreAngariacaoStatus.INICIAL
    
    @staticmethod
    def checklist_padrao():
        """Retornar checklist padrão para nova pré-angariação"""
        return [
            {"id": "first_impression", "title": "1ª Impressão assinada", "completed": False, "required": True},
            {"id": "caderneta", "title": "Caderneta Predial", "completed": False, "required": True},
            {"id": "certidao", "title": "Certidão Permanente", "completed": False, "required": True},
            {"id": "licenca", "title": "Licença de Utilização", "completed": False, "required": False},
            {"id": "certificado_energetico", "title": "Certificado Energético", "completed": False, "required": True},
            {"id": "fotos", "title": "Fotos Profissionais", "completed": False, "required": True},
            {"id": "contrato", "title": "Contrato de Mediação", "completed": False, "required": True},
            {"id": "avaliacao", "title": "Avaliação do Imóvel", "completed": False, "required": True},
            {"id": "docs_proprietario", "title": "Documentos do Proprietário", "completed": False, "required": True},
        ]
