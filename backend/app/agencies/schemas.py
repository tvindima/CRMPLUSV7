from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Any, Dict


class AgencyBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class AgencyCreate(AgencyBase):
    pass


class AgencyUpdate(BaseModel):
    """Schema para actualização de agência (todos os campos opcionais)"""
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    # Campos de CMI
    cmi_template: Optional[Dict[str, Any]] = None
    mediador_nome: Optional[str] = None
    mediador_morada: Optional[str] = None
    mediador_codigo_postal: Optional[str] = None
    mediador_nif: Optional[str] = None
    mediador_capital_social: Optional[str] = None
    mediador_conservatoria: Optional[str] = None
    mediador_licenca_ami: Optional[str] = None
    comissao_venda_percentagem: Optional[str] = None
    comissao_arrendamento_percentagem: Optional[str] = None


class AgencyOut(AgencyBase):
    id: int
    # Campos de CMI
    cmi_template: Optional[Dict[str, Any]] = None
    mediador_nome: Optional[str] = None
    mediador_morada: Optional[str] = None
    mediador_codigo_postal: Optional[str] = None
    mediador_nif: Optional[str] = None
    mediador_capital_social: Optional[str] = None
    mediador_conservatoria: Optional[str] = None
    mediador_licenca_ami: Optional[str] = None
    comissao_venda_percentagem: Optional[str] = None
    comissao_arrendamento_percentagem: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
