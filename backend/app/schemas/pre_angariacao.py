"""
Schemas Pydantic para Pré-Angariação
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# === Tipos de Documentos ===
class DocumentoTipo:
    CADERNETA_PREDIAL = "caderneta_predial"
    CERTIDAO_PERMANENTE = "certidao_permanente"
    LICENCA_UTILIZACAO = "licenca_utilizacao"
    FICHA_TECNICA = "ficha_tecnica"
    CERTIFICADO_ENERGETICO = "certificado_energetico"
    PLANTA_IMOVEL = "planta_imovel"
    CONTRATO_MEDIACAO = "contrato_mediacao"
    DOCUMENTOS_PROPRIETARIO = "documentos_proprietario"
    COMPROVATIVO_IBAN = "comprovativo_iban"
    OUTRO = "outro"


# === Sub-schemas ===
class DocumentoItem(BaseModel):
    """Schema para um documento"""
    type: str = Field(..., description="Tipo do documento")
    name: str = Field(..., description="Nome do ficheiro")
    url: str = Field(..., description="URL do documento")
    uploaded_at: Optional[datetime] = None
    status: str = Field(default="uploaded", description="uploaded, verified, rejected")
    notes: Optional[str] = None


class FotoItem(BaseModel):
    """Schema para uma foto"""
    url: str = Field(..., description="URL da foto")
    caption: Optional[str] = None
    room_type: Optional[str] = None  # sala, quarto, cozinha, wc, exterior
    order: int = Field(default=0, description="Ordem de exibição")
    uploaded_at: Optional[datetime] = None


class ChecklistItem(BaseModel):
    """Schema para item do checklist"""
    id: str = Field(..., description="ID único do item")
    title: str = Field(..., description="Título/descrição")
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    required: bool = Field(default=True)


# === Schemas Base ===
class PreAngariacaoBase(BaseModel):
    """Schema base para Pré-Angariação"""
    proprietario_nome: str = Field(..., min_length=2, description="Nome do proprietário")
    proprietario_nif: Optional[str] = Field(None, max_length=20)
    proprietario_telefone: Optional[str] = Field(None, max_length=50)
    proprietario_email: Optional[str] = Field(None, max_length=255)
    
    # Localização
    morada: Optional[str] = None
    codigo_postal: Optional[str] = None
    freguesia: Optional[str] = None
    concelho: Optional[str] = None
    distrito: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Características
    tipologia: Optional[str] = None
    area_bruta: Optional[Decimal] = None
    area_util: Optional[Decimal] = None
    ano_construcao: Optional[int] = None
    estado_conservacao: Optional[str] = None
    
    # Valores
    valor_pretendido: Optional[Decimal] = None
    valor_avaliacao: Optional[Decimal] = None
    valor_final: Optional[Decimal] = None
    
    # Notas
    notas: Optional[str] = None


class PreAngariacaoCreate(PreAngariacaoBase):
    """Schema para criar Pré-Angariação"""
    first_impression_id: Optional[int] = Field(None, description="ID da 1ª Impressão associada")
    
    # Datas
    data_primeira_visita: Optional[datetime] = None


class PreAngariacaoCreateFromFirstImpression(BaseModel):
    """Schema para criar Pré-Angariação a partir de 1ª Impressão"""
    first_impression_id: int = Field(..., description="ID da 1ª Impressão")


class PreAngariacaoUpdate(BaseModel):
    """Schema para atualizar Pré-Angariação"""
    proprietario_nome: Optional[str] = None
    proprietario_nif: Optional[str] = None
    proprietario_telefone: Optional[str] = None
    proprietario_email: Optional[str] = None
    
    morada: Optional[str] = None
    codigo_postal: Optional[str] = None
    freguesia: Optional[str] = None
    concelho: Optional[str] = None
    distrito: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    tipologia: Optional[str] = None
    area_bruta: Optional[Decimal] = None
    area_util: Optional[Decimal] = None
    ano_construcao: Optional[int] = None
    estado_conservacao: Optional[str] = None
    
    valor_pretendido: Optional[Decimal] = None
    valor_avaliacao: Optional[Decimal] = None
    valor_final: Optional[Decimal] = None
    
    notas: Optional[str] = None
    
    data_primeira_visita: Optional[datetime] = None
    data_contrato: Optional[datetime] = None
    
    # Atualização completa de fotos (substitui lista)
    fotos: Optional[List[FotoItem]] = None


class PreAngariacaoResponse(PreAngariacaoBase):
    """Schema de resposta da Pré-Angariação"""
    id: int
    agent_id: int
    agent_name: Optional[str] = None
    first_impression_id: Optional[int] = None
    property_id: Optional[int] = None
    referencia_interna: Optional[str] = None
    
    # Arrays
    documentos: List[DocumentoItem] = []
    fotos: List[FotoItem] = []
    checklist: List[ChecklistItem] = []
    
    # Status
    status: str
    progresso: int
    
    # Datas
    data_primeira_visita: Optional[datetime] = None
    data_contrato: Optional[datetime] = None
    data_activacao: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PreAngariacaoListItem(BaseModel):
    """Schema simplificado para listagem"""
    id: int
    referencia_interna: Optional[str] = None
    agent_id: int
    agent_name: Optional[str] = None
    proprietario_nome: str
    morada: Optional[str] = None
    tipologia: Optional[str] = None
    valor_pretendido: Optional[Decimal] = None
    status: str
    progresso: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# === Schemas para Documentos ===
class AddDocumentoRequest(BaseModel):
    """Schema para adicionar documento"""
    type: str = Field(..., description="Tipo do documento")
    name: str = Field(..., description="Nome do ficheiro")
    url: str = Field(..., description="URL do documento")
    notes: Optional[str] = None


class UpdateChecklistRequest(BaseModel):
    """Schema para atualizar checklist"""
    item_id: str = Field(..., description="ID do item no checklist")
    completed: bool = Field(..., description="Estado de conclusão")
    notes: Optional[str] = None


class AddFotoRequest(BaseModel):
    """Schema para adicionar foto"""
    url: str = Field(..., description="URL da foto")
    caption: Optional[str] = None
    room_type: Optional[str] = None
    order: int = Field(default=0)


class ActivarAngariacaoRequest(BaseModel):
    """Schema para converter pré-angariação em imóvel ativo"""
    preco_venda: Decimal = Field(..., description="Preço de venda final")
    titulo: str = Field(..., min_length=5, description="Título do anúncio")
    descricao: Optional[str] = None
    business_type: str = Field(default="venda", description="venda ou arrendamento")


class PreAngariacaoStats(BaseModel):
    """Estatísticas das pré-angariações"""
    total: int
    em_progresso: int
    completas: int
    activadas: int
    canceladas: int
