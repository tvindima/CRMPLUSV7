"""
Modelo SQLAlchemy para Cliente
Base de dados de clientes por agente com sincronização para agência
"""
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Boolean, Enum, DECIMAL
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


class EstadoCivil(str, enum.Enum):
    """Estado civil"""
    SOLTEIRO = "solteiro"
    CASADO = "casado"
    UNIAO_FACTO = "uniao_facto"
    DIVORCIADO = "divorciado"
    VIUVO = "viuvo"
    SEPARADO = "separado"


class RegimeCasamento(str, enum.Enum):
    """Regime de casamento"""
    COMUNHAO_ADQUIRIDOS = "comunhao_adquiridos"  # Comunhão de adquiridos (default em PT)
    COMUNHAO_GERAL = "comunhao_geral"            # Comunhão geral de bens
    SEPARACAO_BENS = "separacao_bens"            # Separação de bens


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
    is_empresa = Column(Boolean, default=False)  # Se é pessoa singular ou empresa
    
    # === Dados Pessoais ===
    nome = Column(String(255), nullable=False, index=True)
    nif = Column(String(20), nullable=True, index=True)
    cc = Column(String(30), nullable=True)  # Número do Cartão de Cidadão
    cc_validade = Column(Date, nullable=True)
    data_nascimento = Column(Date, nullable=True)
    naturalidade = Column(String(255), nullable=True)  # Cidade/País de nascimento
    nacionalidade = Column(String(100), nullable=True)
    profissao = Column(String(255), nullable=True)
    entidade_empregadora = Column(String(255), nullable=True)
    
    # === Estado Civil e Casamento ===
    estado_civil = Column(String(50), nullable=True)
    regime_casamento = Column(String(50), nullable=True)  # Só se casado/união de facto
    data_casamento = Column(Date, nullable=True)
    
    # === Dados do Cônjuge (se casado/união de facto) ===
    conjuge_nome = Column(String(255), nullable=True)
    conjuge_nif = Column(String(20), nullable=True)
    conjuge_cc = Column(String(30), nullable=True)
    conjuge_cc_validade = Column(Date, nullable=True)
    conjuge_data_nascimento = Column(Date, nullable=True)
    conjuge_naturalidade = Column(String(255), nullable=True)
    conjuge_nacionalidade = Column(String(100), nullable=True)
    conjuge_profissao = Column(String(255), nullable=True)
    conjuge_email = Column(String(255), nullable=True)
    conjuge_telefone = Column(String(50), nullable=True)
    
    # === Dados Empresa (se representante) ===
    empresa_nome = Column(String(255), nullable=True)
    empresa_nipc = Column(String(20), nullable=True)  # NIPC da empresa
    empresa_sede = Column(String(500), nullable=True)
    empresa_capital_social = Column(DECIMAL(15, 2), nullable=True)
    empresa_conservatoria = Column(String(255), nullable=True)
    empresa_matricula = Column(String(50), nullable=True)
    empresa_cargo = Column(String(100), nullable=True)  # Cargo do cliente na empresa
    empresa_poderes = Column(Text, nullable=True)  # Descrição dos poderes de representação
    
    # === Contactos ===
    email = Column(String(255), nullable=True, index=True)
    telefone = Column(String(50), nullable=True, index=True)
    telefone_alt = Column(String(50), nullable=True)
    
    # === Morada ===
    morada = Column(String(500), nullable=True)
    numero_porta = Column(String(20), nullable=True)
    andar = Column(String(20), nullable=True)
    codigo_postal = Column(String(20), nullable=True)
    localidade = Column(String(255), nullable=True)
    concelho = Column(String(255), nullable=True)
    distrito = Column(String(100), nullable=True)
    pais = Column(String(100), default="Portugal")
    
    # === Documentos (URLs dos ficheiros) ===
    documentos = Column(JSON, default=list)  # Array de docs: [{tipo, nome, url, data_upload}]
    # Tipos: cc_frente, cc_verso, nif, comprovativo_morada, procuracao, certidao_casamento, etc.
    
    # === CRM / Notas ===
    notas = Column(Text, nullable=True)  # Notas do agente sobre o cliente
    tags = Column(JSON, default=list)    # Tags para organização: ["VIP", "Urgente", etc.]
    preferencias = Column(JSON, default=dict)  # Preferências de imóveis (para compradores)
    
    # === Tracking ===
    ultima_interacao = Column(DateTime(timezone=True), nullable=True)
    proxima_acao = Column(String(500), nullable=True)
    proxima_acao_data = Column(DateTime(timezone=True), nullable=True)
    
    # === Metadata ===
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Dados verificados/validados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # === Relationships ===
    agent = relationship("Agent", backref="clients")
    angariacao = relationship("PreAngariacao", backref="clientes")
    property = relationship("Property", backref="clientes")
    transacoes = relationship("ClientTransacao", back_populates="client", order_by="desc(ClientTransacao.data)")
    
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
            "is_empresa": self.is_empresa,
            
            # Dados pessoais
            "nome": self.nome,
            "nif": self.nif,
            "cc": self.cc,
            "cc_validade": self.cc_validade.isoformat() if self.cc_validade else None,
            "data_nascimento": self.data_nascimento.isoformat() if self.data_nascimento else None,
            "naturalidade": self.naturalidade,
            "nacionalidade": self.nacionalidade,
            "profissao": self.profissao,
            "entidade_empregadora": self.entidade_empregadora,
            
            # Estado civil e casamento
            "estado_civil": self.estado_civil,
            "regime_casamento": self.regime_casamento,
            "data_casamento": self.data_casamento.isoformat() if self.data_casamento else None,
            
            # Dados do cônjuge
            "conjuge_nome": self.conjuge_nome,
            "conjuge_nif": self.conjuge_nif,
            "conjuge_cc": self.conjuge_cc,
            "conjuge_cc_validade": self.conjuge_cc_validade.isoformat() if self.conjuge_cc_validade else None,
            "conjuge_data_nascimento": self.conjuge_data_nascimento.isoformat() if self.conjuge_data_nascimento else None,
            "conjuge_naturalidade": self.conjuge_naturalidade,
            "conjuge_nacionalidade": self.conjuge_nacionalidade,
            "conjuge_profissao": self.conjuge_profissao,
            "conjuge_email": self.conjuge_email,
            "conjuge_telefone": self.conjuge_telefone,
            
            # Dados empresa
            "empresa_nome": self.empresa_nome,
            "empresa_nipc": self.empresa_nipc,
            "empresa_sede": self.empresa_sede,
            "empresa_capital_social": float(self.empresa_capital_social) if self.empresa_capital_social else None,
            "empresa_conservatoria": self.empresa_conservatoria,
            "empresa_matricula": self.empresa_matricula,
            "empresa_cargo": self.empresa_cargo,
            "empresa_poderes": self.empresa_poderes,
            
            # Contactos
            "email": self.email,
            "telefone": self.telefone,
            "telefone_alt": self.telefone_alt,
            
            # Morada
            "morada": self.morada,
            "numero_porta": self.numero_porta,
            "andar": self.andar,
            "codigo_postal": self.codigo_postal,
            "localidade": self.localidade,
            "concelho": self.concelho,
            "distrito": self.distrito,
            "pais": self.pais,
            
            # Documentos
            "documentos": self.documentos or [],
            
            # CRM
            "notas": self.notas,
            "tags": self.tags or [],
            "preferencias": self.preferencias or {},
            "ultima_interacao": self.ultima_interacao.isoformat() if self.ultima_interacao else None,
            "proxima_acao": self.proxima_acao,
            "proxima_acao_data": self.proxima_acao_data.isoformat() if self.proxima_acao_data else None,
            
            # Relações
            "angariacao_id": self.angariacao_id,
            "property_id": self.property_id,
            "lead_id": self.lead_id,
            
            # Meta
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def to_dict_resumo(self):
        """Versão resumida para listas"""
        return {
            "id": self.id,
            "nome": self.nome,
            "nif": self.nif,
            "email": self.email,
            "telefone": self.telefone,
            "client_type": self.client_type,
            "is_empresa": self.is_empresa,
            "estado_civil": self.estado_civil,
            "is_verified": self.is_verified,
            "tags": self.tags or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TipoTransacao(str, enum.Enum):
    """Tipos de transação"""
    VENDA = "venda"
    COMPRA = "compra"
    ARRENDAMENTO_SENHORIO = "arrendamento_senhorio"
    ARRENDAMENTO_INQUILINO = "arrendamento_inquilino"
    TRESPASSE = "trespasse"
    PERMUTA = "permuta"


class ClientTransacao(Base):
    """
    Histórico de transações de um cliente
    
    Regista todas as transações imobiliárias do cliente:
    - Imóveis vendidos
    - Imóveis comprados
    - Arrendamentos (como senhorio ou inquilino)
    """
    
    __tablename__ = "client_transacoes"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    
    # === Tipo e Detalhes ===
    tipo = Column(String(50), nullable=False)  # venda, compra, arrendamento, etc.
    descricao = Column(String(500), nullable=True)  # Descrição breve (ex: "T3 em Cascais")
    referencia_imovel = Column(String(100), nullable=True)  # Referência do imóvel
    
    # === Valores ===
    valor = Column(DECIMAL(15, 2), nullable=True)
    comissao = Column(DECIMAL(15, 2), nullable=True)
    
    # === Datas ===
    data = Column(Date, nullable=False)  # Data da transação/escritura
    data_contrato = Column(Date, nullable=True)  # Data assinatura CPCV/CMI
    
    # === Partes envolvidas ===
    outra_parte_nome = Column(String(255), nullable=True)  # Nome do comprador/vendedor
    outra_parte_nif = Column(String(20), nullable=True)
    
    # === Notas e Documentos ===
    notas = Column(Text, nullable=True)
    documentos = Column(JSON, default=list)  # [{tipo, nome, url}]
    
    # === Metadata ===
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # === Relationships ===
    client = relationship("Client", back_populates="transacoes")
    agent = relationship("Agent")
    property = relationship("Property")
    
    def __repr__(self):
        return f"<ClientTransacao(id={self.id}, client_id={self.client_id}, tipo='{self.tipo}', valor={self.valor})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "agent_id": self.agent_id,
            "property_id": self.property_id,
            "tipo": self.tipo,
            "descricao": self.descricao,
            "referencia_imovel": self.referencia_imovel,
            "valor": float(self.valor) if self.valor else None,
            "comissao": float(self.comissao) if self.comissao else None,
            "data": self.data.isoformat() if self.data else None,
            "data_contrato": self.data_contrato.isoformat() if self.data_contrato else None,
            "outra_parte_nome": self.outra_parte_nome,
            "outra_parte_nif": self.outra_parte_nif,
            "notas": self.notas,
            "documentos": self.documentos or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
