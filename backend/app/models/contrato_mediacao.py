"""
Modelo SQLAlchemy para CMI - Contrato de Mediação Imobiliária
"""
from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
from app.database import Base


class TipoContrato:
    """Tipos de contrato de mediação"""
    EXCLUSIVO = "exclusivo"
    NAO_EXCLUSIVO = "nao_exclusivo"
    PARTILHADO = "partilhado"


class CMIStatus:
    """Estados do CMI"""
    RASCUNHO = "rascunho"
    PENDENTE_ASSINATURA = "pendente_assinatura"
    ASSINADO = "assinado"
    CANCELADO = "cancelado"
    EXPIRADO = "expirado"


class ContratoMediacaoImobiliaria(Base):
    """
    CMI - Contrato de Mediação Imobiliária
    
    Documento oficial entre o mediador imobiliário e o cliente
    para formalizar a angariação de um imóvel.
    
    Baseado no modelo legal português de CMI.
    """
    
    __tablename__ = "contratos_mediacao"
    
    # === IDs & Keys ===
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    first_impression_id = Column(Integer, ForeignKey("first_impressions.id", ondelete="SET NULL"), nullable=True, index=True)
    pre_angariacao_id = Column(Integer, ForeignKey("pre_angariacoes.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Número do contrato (gerado automaticamente)
    numero_contrato = Column(String(50), nullable=False, unique=True, index=True)
    
    # === SECÇÃO 1: MEDIADOR ===
    # Dados da Agência (podem vir do sistema)
    mediador_nome = Column(String(255), nullable=False)  # Nome da empresa
    mediador_licenca_ami = Column(String(50), nullable=False)  # Licença AMI
    mediador_nif = Column(String(20), nullable=False)  # NIF da empresa
    mediador_morada = Column(Text, nullable=True)
    mediador_codigo_postal = Column(String(20), nullable=True)
    mediador_telefone = Column(String(50), nullable=True)
    mediador_email = Column(String(255), nullable=True)
    
    # Dados do Agente (consultor que angaria)
    agente_nome = Column(String(255), nullable=True)
    agente_carteira_profissional = Column(String(100), nullable=True)  # Nº carteira profissional
    
    # === SECÇÃO 2: CLIENTE (Primeiro Outorgante) ===
    cliente_nome = Column(String(255), nullable=False)
    cliente_estado_civil = Column(String(50), nullable=True)  # solteiro, casado, etc.
    cliente_nif = Column(String(20), nullable=True)
    cliente_cc = Column(String(30), nullable=True)  # Cartão Cidadão / BI
    cliente_cc_validade = Column(Date, nullable=True)
    cliente_morada = Column(Text, nullable=True)
    cliente_codigo_postal = Column(String(20), nullable=True)
    cliente_localidade = Column(String(255), nullable=True)
    cliente_telefone = Column(String(50), nullable=True)
    cliente_email = Column(String(255), nullable=True)
    
    # Se houver segundo outorgante (cônjuge, co-proprietário)
    cliente2_nome = Column(String(255), nullable=True)
    cliente2_nif = Column(String(20), nullable=True)
    cliente2_cc = Column(String(30), nullable=True)
    
    # === SECÇÃO 3: IMÓVEL ===
    imovel_tipo = Column(String(100), nullable=True)  # Apartamento, Moradia, Terreno, etc.
    imovel_tipologia = Column(String(50), nullable=True)  # T0, T1, T2, etc.
    imovel_morada = Column(Text, nullable=True)
    imovel_codigo_postal = Column(String(20), nullable=True)
    imovel_localidade = Column(String(255), nullable=True)
    imovel_freguesia = Column(String(255), nullable=True)
    imovel_concelho = Column(String(255), nullable=True)
    imovel_distrito = Column(String(255), nullable=True)
    
    # Registo predial
    imovel_artigo_matricial = Column(String(100), nullable=True)
    imovel_fraccao = Column(String(20), nullable=True)  # Fração (se apartamento)
    imovel_conservatoria = Column(String(255), nullable=True)  # Conservatória do Registo Predial
    imovel_numero_descricao = Column(String(100), nullable=True)  # Nº descrição predial
    
    # Áreas
    imovel_area_bruta = Column(DECIMAL(10, 2), nullable=True)
    imovel_area_util = Column(DECIMAL(10, 2), nullable=True)
    imovel_area_terreno = Column(DECIMAL(10, 2), nullable=True)
    
    # Características
    imovel_ano_construcao = Column(Integer, nullable=True)
    imovel_estado_conservacao = Column(String(100), nullable=True)
    imovel_certificado_energetico = Column(String(10), nullable=True)  # A+, A, B, C, D, E, F
    
    # === SECÇÃO 4: CONDIÇÕES DO CONTRATO ===
    tipo_contrato = Column(String(50), nullable=False, default=TipoContrato.EXCLUSIVO)
    tipo_negocio = Column(String(50), nullable=False, default="venda")  # venda, arrendamento
    
    # Valor
    valor_pretendido = Column(DECIMAL(15, 2), nullable=True)  # Valor de venda pretendido
    valor_minimo = Column(DECIMAL(15, 2), nullable=True)  # Valor mínimo aceite
    
    # Comissão
    comissao_percentagem = Column(DECIMAL(5, 2), nullable=True)  # Ex: 5.00 = 5%
    comissao_valor_fixo = Column(DECIMAL(15, 2), nullable=True)  # Valor fixo (alternativa)
    comissao_iva_incluido = Column(Boolean, default=False)
    comissao_observacoes = Column(Text, nullable=True)
    
    # Prazo
    data_inicio = Column(Date, nullable=True)
    data_fim = Column(Date, nullable=True)
    prazo_meses = Column(Integer, nullable=True, default=6)  # Tipicamente 6 meses
    renovacao_automatica = Column(Boolean, default=True)
    
    # === SECÇÃO 5: DOCUMENTOS ANEXOS (JSON) ===
    # Lista de documentos entregues pelo cliente
    documentos_entregues = Column(JSON, default=list)
    """
    Exemplo:
    [
        {"tipo": "caderneta_predial", "entregue": true, "data": "2025-01-01"},
        {"tipo": "certidao_permanente", "entregue": true},
        {"tipo": "certificado_energetico", "entregue": false},
    ]
    """
    
    # Fotos dos documentos capturadas via OCR
    documentos_fotos = Column(JSON, default=list)
    """
    [{"tipo": "cc_frente", "url": "...", "dados_extraidos": {...}}]
    """
    
    # === SECÇÃO 6: ASSINATURAS ===
    assinatura_cliente = Column(Text, nullable=True)  # base64 PNG
    assinatura_cliente_data = Column(DateTime(timezone=True), nullable=True)
    assinatura_cliente2 = Column(Text, nullable=True)  # Segundo outorgante
    assinatura_cliente2_data = Column(DateTime(timezone=True), nullable=True)
    assinatura_mediador = Column(Text, nullable=True)
    assinatura_mediador_data = Column(DateTime(timezone=True), nullable=True)
    
    # Local de assinatura
    local_assinatura = Column(String(255), nullable=True)
    
    # === SECÇÃO 7: CLÁUSULAS ESPECIAIS ===
    clausulas_especiais = Column(Text, nullable=True)
    
    # === SECÇÃO 8: PDF GERADO ===
    pdf_url = Column(String(500), nullable=True)
    pdf_generated_at = Column(DateTime(timezone=True), nullable=True)
    
    # === STATUS & METADATA ===
    status = Column(String(50), default=CMIStatus.RASCUNHO, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # === RELATIONSHIPS ===
    agent = relationship("Agent", backref="contratos_mediacao")
    first_impression = relationship("FirstImpression", backref="contrato_mediacao", uselist=False)
    
    def __repr__(self):
        return f"<CMI(id={self.id}, numero={self.numero_contrato}, cliente={self.cliente_nome})>"
    
    @staticmethod
    def documentos_checklist():
        """Lista de documentos necessários para o CMI"""
        return [
            {"tipo": "cc_proprietario", "nome": "Cartão Cidadão / BI do Proprietário", "obrigatorio": True},
            {"tipo": "caderneta_predial", "nome": "Caderneta Predial Urbana", "obrigatorio": True},
            {"tipo": "certidao_permanente", "nome": "Certidão Permanente do Registo Predial", "obrigatorio": True},
            {"tipo": "licenca_utilizacao", "nome": "Licença de Utilização", "obrigatorio": False},
            {"tipo": "certificado_energetico", "nome": "Certificado Energético", "obrigatorio": True},
            {"tipo": "planta", "nome": "Planta do Imóvel", "obrigatorio": False},
            {"tipo": "comprovativo_morada", "nome": "Comprovativo de Morada", "obrigatorio": False},
        ]
