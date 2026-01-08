"""
Schemas Pydantic para First Impressions
"""
from pydantic import BaseModel, Field, field_validator, field_serializer, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from decimal import Decimal


# === BASE SCHEMA ===
class FirstImpressionBase(BaseModel):
    """Campos base compartilhados"""
    
    # Dados CMI
    artigo_matricial: Optional[str] = Field(None, max_length=50, description="Artigo Matricial da CMI")
    freguesia: Optional[str] = Field(None, max_length=255)
    concelho: Optional[str] = Field(None, max_length=255)
    distrito: Optional[str] = Field(None, max_length=255)
    area_bruta: Optional[Decimal] = Field(None, ge=0, description="Área bruta em m²")
    area_util: Optional[Decimal] = Field(None, ge=0, description="Área útil em m²")
    tipologia: Optional[str] = Field(None, max_length=50, description="Ex: T3, T2, T4")
    tipo_imovel: Optional[str] = Field(None, max_length=100, description="Apartamento, Moradia, Terreno, etc.")
    ano_construcao: Optional[int] = Field(None, ge=1500, le=2100)
    valor_patrimonial: Optional[Decimal] = Field(None, ge=0, description="Valor patrimonial em €")
    
    # Dados Cliente (todos opcionais - pode ser preenchido depois por OCR)
    client_name: Optional[str] = Field(None, max_length=255, description="Nome completo do cliente (opcional - pode ser preenchido depois)")
    client_nif: Optional[str] = Field(None, max_length=20, description="NIF do cliente (opcional)")
    client_phone: Optional[str] = Field(None, min_length=9, max_length=50, description="Telefone (opcional)")
    client_email: Optional[str] = Field(None, max_length=255, description="Email (opcional)")
    referred_by: Optional[str] = Field(None, max_length=255, description="Nome de quem indicou")
    
    # Localização GPS
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90, description="GPS latitude")
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180, description="GPS longitude")
    location: Optional[str] = Field(None, max_length=500, description="Morada texto")
    
    # Campos adicionais CMI
    estado_conservacao: Optional[str] = Field(None, max_length=100, description="Estado conservação")
    valor_estimado: Optional[Decimal] = Field(None, ge=0, description="Valor estimado €")
    
    # Fotos & Anexos
    photos: Optional[List[str]] = Field(None, description="Array URLs fotos")
    attachments: Optional[List[Dict[str, str]]] = Field(None, description="Array anexos")
    
    # Observações
    observations: Optional[str] = Field(None, description="Observações adicionais")
    
    # ✅ VALIDATORS REMOVIDOS - Validação só no frontend
    # Campos Optional aceitam None sem validação
    # Frontend valida formato ao digitar



# === CREATE SCHEMA ===
class FirstImpressionCreate(FirstImpressionBase):
    """Schema para criar First Impression"""
    
    property_id: Optional[int] = Field(None, description="ID do imóvel (opcional)")
    lead_id: Optional[int] = Field(None, description="ID do lead (opcional)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "client_name": "João Silva",  # Opcional - pode ser None
                "client_nif": "123456789",
                "client_phone": "+351912345678",
                "client_email": "joao@example.com",
                "artigo_matricial": "1234-2024",
                "freguesia": "São Domingos de Rana",
                "concelho": "Cascais",
                "distrito": "Lisboa",
                "area_bruta": 120.50,
                "area_util": 95.30,
                "tipologia": "T3",
                "ano_construcao": 2005,
                "valor_patrimonial": 180000.00,
                "observations": "Imóvel em bom estado",
                "property_id": 123,
                "lead_id": 456
            }
        }
    )


# === UPDATE SCHEMA ===
class FirstImpressionUpdate(BaseModel):
    """Schema para atualizar First Impression (todos campos opcionais)"""
    
    # Dados CMI
    artigo_matricial: Optional[str] = None
    freguesia: Optional[str] = None
    concelho: Optional[str] = None
    distrito: Optional[str] = None
    area_bruta: Optional[Decimal] = None
    area_util: Optional[Decimal] = None
    tipologia: Optional[str] = None
    tipo_imovel: Optional[str] = None  # Apartamento, Moradia, Terreno, etc.
    ano_construcao: Optional[int] = None
    valor_patrimonial: Optional[Decimal] = None
    
    # Dados Cliente
    client_name: Optional[str] = None
    client_nif: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    
    # Observações
    observations: Optional[str] = None
    
    # Relationships
    property_id: Optional[int] = None
    lead_id: Optional[int] = None
    
    # Status
    status: Optional[str] = Field(None, pattern="^(draft|signed|completed|cancelled)$")


# === SIGNATURE SCHEMA ===
class FirstImpressionSignature(BaseModel):
    """Schema para adicionar assinatura"""
    
    signature_image: str = Field(..., description="Assinatura em base64 (PNG)")
    
    @field_validator('signature_image')
    @classmethod
    def validate_signature(cls, v: str) -> str:
        """Validar que é base64 válido"""
        if not v or len(v) < 100:
            raise ValueError('Assinatura inválida (muito curta)')
        
        # Verificar se começa com data URI (opcional)
        if v.startswith('data:image'):
            # Extrair só o base64
            if ',' in v:
                v = v.split(',', 1)[1]
        
        # Validar caracteres base64
        import re
        if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', v):
            raise ValueError('Formato base64 inválido')
        
        return v
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "signature_image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            }
        }
    )


# === RESPONSE SCHEMA ===
class FirstImpressionResponse(FirstImpressionBase):
    """Schema de resposta (com todos os campos)"""
    
    id: int
    agent_id: int
    property_id: Optional[int] = None
    lead_id: Optional[int] = None
    
    signature_image: Optional[str] = None
    signature_date: Optional[datetime] = None
    
    pdf_url: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    
    status: str
    created_at: datetime
    updated_at: datetime
    
    # ✅ Garantir defaults explícitos para TODOS os Optional fields (evitar 500 se NULL)
    # Sobrescrever campos do Base com defaults explícitos para response validation
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    client_nif: Optional[str] = None
    referred_by: Optional[str] = None
    artigo_matricial: Optional[str] = None
    freguesia: Optional[str] = None
    concelho: Optional[str] = None
    distrito: Optional[str] = None
    tipologia: Optional[str] = None
    tipo_imovel: Optional[str] = None  # Apartamento, Moradia, Terreno, etc.
    area_bruta: Optional[Decimal] = None
    area_util: Optional[Decimal] = None
    ano_construcao: Optional[int] = None
    valor_patrimonial: Optional[Decimal] = None
    estado_conservacao: Optional[str] = None
    valor_estimado: Optional[Decimal] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    location: Optional[str] = None
    photos: Optional[List[str]] = None
    attachments: Optional[List[Dict[str, str]]] = None
    observations: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    # ✅ Serializar Decimal como float para evitar strings em JSON
    @field_serializer('area_bruta', 'area_util', 'valor_patrimonial', 'valor_estimado', 'latitude', 'longitude')
    def serialize_decimal(self, value: Optional[Decimal]) -> Optional[float]:
        """Converter Decimal para float (ou None se null)"""
        return float(value) if value is not None else None


# === LIST RESPONSE (sem signature_image para performance) ===
class FirstImpressionListItem(BaseModel):
    """Item de lista (sem campos pesados)"""
    
    id: int
    agent_id: int
    property_id: Optional[int] = None
    lead_id: Optional[int] = None
    
    client_name: Optional[str] = None  # ✅ Opcional - pode ser preenchido depois
    client_nif: Optional[str] = None
    client_phone: Optional[str] = None  # ✅ Corrigido: era str obrigatório, mas DB permite NULL
    
    artigo_matricial: Optional[str] = None
    tipologia: Optional[str] = None
    
    status: str
    created_at: datetime
    pdf_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
