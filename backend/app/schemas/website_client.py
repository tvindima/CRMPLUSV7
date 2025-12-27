"""
Schemas para autenticação de clientes do website
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime


class WebsiteClientRegister(BaseModel):
    """Schema para registo de novo cliente"""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    # Novas perguntas de qualificação
    interest_type: Literal["compra", "arrendamento"] = "compra"  # O que procura
    client_type: Literal["investidor", "pontual"] = "pontual"  # Tipo de cliente (só para compra)
    selected_agent_id: Optional[int] = None  # Agente escolhido (opcional)


class WebsiteClientLogin(BaseModel):
    """Schema para login de cliente"""
    email: EmailStr
    password: str


class AgentForSelection(BaseModel):
    """Agente disponível para seleção pelo cliente"""
    id: int
    name: str
    avatar_url: Optional[str] = None
    specialty: Optional[str] = None  # "venda" ou "arrendamento"
    
    class Config:
        from_attributes = True


class WebsiteClientOut(BaseModel):
    """Schema de resposta (sem password)"""
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    client_type: Optional[str] = "pontual"
    interest_type: Optional[str] = "compra"
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    agent_selected_by_client: Optional[bool] = False
    is_active: bool
    is_verified: bool
    receive_alerts: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebsiteClientUpdate(BaseModel):
    """Schema para atualizar dados do cliente"""
    name: Optional[str] = None
    phone: Optional[str] = None
    receive_alerts: Optional[bool] = None
    search_preferences: Optional[str] = None


class WebsiteClientToken(BaseModel):
    """Resposta de login com token"""
    access_token: str
    token_type: str = "bearer"
    client: WebsiteClientOut


class WebsiteClientListItem(BaseModel):
    """Item para listagem de clientes no backoffice"""
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    client_type: Optional[str] = None
    interest_type: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    agent_selected_by_client: bool = False
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
