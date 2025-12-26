"""
Schemas Pydantic para CMI - Contrato de Mediação Imobiliária
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


# === Enums ===
class TipoContratoEnum:
    EXCLUSIVO = "exclusivo"
    NAO_EXCLUSIVO = "nao_exclusivo"
    PARTILHADO = "partilhado"


class TipoNegocioEnum:
    VENDA = "venda"
    ARRENDAMENTO = "arrendamento"


# === Sub-schemas ===
class DocumentoEntregue(BaseModel):
    """Documento entregue pelo cliente"""
    tipo: str
    nome: Optional[str] = None
    entregue: bool = False
    data: Optional[date] = None
    observacoes: Optional[str] = None


class DocumentoFoto(BaseModel):
    """Foto de documento capturada"""
    tipo: str  # cc_frente, cc_verso, caderneta, etc.
    url: str
    dados_extraidos: Optional[dict] = None  # Dados extraídos via OCR
    uploaded_at: Optional[datetime] = None


# === Schemas Base ===
class CMIBase(BaseModel):
    """Schema base do CMI"""
    
    # Cliente
    cliente_nome: str = Field(..., min_length=2)
    cliente_estado_civil: Optional[str] = None
    cliente_nif: Optional[str] = None
    cliente_cc: Optional[str] = None
    cliente_cc_validade: Optional[date] = None
    cliente_morada: Optional[str] = None
    cliente_codigo_postal: Optional[str] = None
    cliente_localidade: Optional[str] = None
    cliente_telefone: Optional[str] = None
    cliente_email: Optional[str] = None
    
    # Segundo cliente (opcional)
    cliente2_nome: Optional[str] = None
    cliente2_nif: Optional[str] = None
    cliente2_cc: Optional[str] = None
    
    # Imóvel
    imovel_tipo: Optional[str] = None
    imovel_tipologia: Optional[str] = None
    imovel_morada: Optional[str] = None
    imovel_codigo_postal: Optional[str] = None
    imovel_localidade: Optional[str] = None
    imovel_freguesia: Optional[str] = None
    imovel_concelho: Optional[str] = None
    imovel_distrito: Optional[str] = None
    imovel_artigo_matricial: Optional[str] = None
    imovel_fraccao: Optional[str] = None
    imovel_conservatoria: Optional[str] = None
    imovel_numero_descricao: Optional[str] = None
    imovel_area_bruta: Optional[Decimal] = None
    imovel_area_util: Optional[Decimal] = None
    imovel_area_terreno: Optional[Decimal] = None
    imovel_ano_construcao: Optional[int] = None
    imovel_estado_conservacao: Optional[str] = None
    imovel_certificado_energetico: Optional[str] = None
    
    # Condições
    tipo_contrato: str = Field(default="exclusivo")
    tipo_negocio: str = Field(default="venda")
    valor_pretendido: Optional[Decimal] = None
    valor_minimo: Optional[Decimal] = None
    comissao_percentagem: Optional[Decimal] = None
    comissao_valor_fixo: Optional[Decimal] = None
    comissao_iva_incluido: bool = False
    comissao_observacoes: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    prazo_meses: int = Field(default=6)
    renovacao_automatica: bool = True
    
    # Ónus e encargos
    imovel_livre_onus: bool = Field(default=True, description="True = livre de ónus, False = tem ónus/encargos")
    imovel_onus_descricao: Optional[str] = Field(default=None, description="Descrição dos ónus (hipotecas, penhoras)")
    imovel_onus_valor: Optional[Decimal] = Field(default=None, description="Valor em dívida dos ónus")
    
    # Condições de pagamento da comissão
    opcao_pagamento: str = Field(default="cpcv", description="Opção de pagamento: cpcv, escritura, faseado")
    pagamento_percentagem_cpcv: Optional[Decimal] = Field(default=50, description="% a pagar no CPCV (se faseado)")
    pagamento_percentagem_escritura: Optional[Decimal] = Field(default=50, description="% a pagar na escritura (se faseado)")
    
    # Cláusulas
    clausulas_especiais: Optional[str] = None


class CMICreate(CMIBase):
    """Schema para criar CMI"""
    first_impression_id: Optional[int] = None
    pre_angariacao_id: Optional[int] = None


class CMICreateFromFirstImpression(BaseModel):
    """Criar CMI a partir de 1ª Impressão"""
    first_impression_id: int


class CMIUpdate(BaseModel):
    """Schema para atualizar CMI"""
    cliente_nome: Optional[str] = None
    cliente_estado_civil: Optional[str] = None
    cliente_nif: Optional[str] = None
    cliente_cc: Optional[str] = None
    cliente_cc_validade: Optional[date] = None
    cliente_morada: Optional[str] = None
    cliente_codigo_postal: Optional[str] = None
    cliente_localidade: Optional[str] = None
    cliente_telefone: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente2_nome: Optional[str] = None
    cliente2_nif: Optional[str] = None
    cliente2_cc: Optional[str] = None
    
    imovel_tipo: Optional[str] = None
    imovel_tipologia: Optional[str] = None
    imovel_morada: Optional[str] = None
    imovel_codigo_postal: Optional[str] = None
    imovel_localidade: Optional[str] = None
    imovel_freguesia: Optional[str] = None
    imovel_concelho: Optional[str] = None
    imovel_distrito: Optional[str] = None
    imovel_artigo_matricial: Optional[str] = None
    imovel_fraccao: Optional[str] = None
    imovel_conservatoria: Optional[str] = None
    imovel_numero_descricao: Optional[str] = None
    imovel_area_bruta: Optional[Decimal] = None
    imovel_area_util: Optional[Decimal] = None
    imovel_area_terreno: Optional[Decimal] = None
    imovel_ano_construcao: Optional[int] = None
    imovel_estado_conservacao: Optional[str] = None
    imovel_certificado_energetico: Optional[str] = None
    
    tipo_contrato: Optional[str] = None
    tipo_negocio: Optional[str] = None
    valor_pretendido: Optional[Decimal] = None
    valor_minimo: Optional[Decimal] = None
    comissao_percentagem: Optional[Decimal] = None
    comissao_valor_fixo: Optional[Decimal] = None
    comissao_iva_incluido: Optional[bool] = None
    comissao_observacoes: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    prazo_meses: Optional[int] = None
    renovacao_automatica: Optional[bool] = None
    
    # Ónus e encargos
    imovel_livre_onus: Optional[bool] = None
    imovel_onus_descricao: Optional[str] = None
    imovel_onus_valor: Optional[Decimal] = None
    
    # Condições de pagamento
    opcao_pagamento: Optional[str] = None
    pagamento_percentagem_cpcv: Optional[Decimal] = None
    pagamento_percentagem_escritura: Optional[Decimal] = None
    
    # Agente
    agente_nome: Optional[str] = None
    agente_carteira_profissional: Optional[str] = None
    
    clausulas_especiais: Optional[str] = None


class CMIResponse(CMIBase):
    """Schema de resposta do CMI"""
    id: int
    agent_id: int
    first_impression_id: Optional[int] = None
    pre_angariacao_id: Optional[int] = None
    numero_contrato: str
    
    # Mediador
    mediador_nome: str
    mediador_licenca_ami: str
    mediador_nif: str
    mediador_morada: Optional[str] = None
    mediador_codigo_postal: Optional[str] = None
    mediador_telefone: Optional[str] = None
    mediador_email: Optional[str] = None
    agente_nome: Optional[str] = None
    agente_carteira_profissional: Optional[str] = None
    
    # Documentos
    documentos_entregues: List[DocumentoEntregue] = []
    documentos_fotos: List[DocumentoFoto] = []
    
    # Assinaturas
    assinatura_cliente: Optional[str] = None
    assinatura_cliente_data: Optional[datetime] = None
    assinatura_cliente2: Optional[str] = None
    assinatura_cliente2_data: Optional[datetime] = None
    assinatura_mediador: Optional[str] = None
    assinatura_mediador_data: Optional[datetime] = None
    local_assinatura: Optional[str] = None
    
    # Ónus e encargos
    imovel_livre_onus: bool = True
    imovel_onus_descricao: Optional[str] = None
    imovel_onus_valor: Optional[Decimal] = None
    
    # Condições de pagamento
    opcao_pagamento: str = "cpcv"
    pagamento_percentagem_cpcv: Optional[Decimal] = None
    pagamento_percentagem_escritura: Optional[Decimal] = None
    
    # PDF
    pdf_url: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    
    # Status
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CMIListItem(BaseModel):
    """Schema simplificado para listagem"""
    id: int
    numero_contrato: str
    cliente_nome: str
    imovel_morada: Optional[str] = None
    imovel_tipologia: Optional[str] = None
    valor_pretendido: Optional[Decimal] = None
    tipo_contrato: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# === Schemas para Assinaturas ===
class AssinaturaClienteRequest(BaseModel):
    """Adicionar assinatura do cliente"""
    assinatura: str = Field(..., description="Imagem base64 da assinatura")
    local: Optional[str] = None


class AssinaturaMediadorRequest(BaseModel):
    """Adicionar assinatura do mediador"""
    assinatura: str = Field(..., description="Imagem base64 da assinatura")


# === Schemas para OCR ===
class DocumentoOCRRequest(BaseModel):
    """Request para processar documento via OCR"""
    tipo: str = Field(..., description="Tipo de documento: cc_frente, cc_verso, caderneta, etc.")
    imagem_base64: str = Field(..., description="Imagem do documento em base64")


class DocumentoOCRResponse(BaseModel):
    """Resposta do processamento OCR"""
    sucesso: bool
    tipo: str
    dados_extraidos: dict = {}
    confianca: float = 0.0
    mensagem: Optional[str] = None


class CMIStats(BaseModel):
    """Estatísticas de CMIs"""
    total: int
    rascunhos: int
    pendentes: int
    assinados: int
    cancelados: int
