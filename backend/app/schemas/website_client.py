"""
Schemas para autenticação de clientes do website
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class WebsiteClientRegister(BaseModel):
    """Schema para registo de novo cliente"""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str


class WebsiteClientLogin(BaseModel):
    """Schema para login de cliente"""
    email: EmailStr
    password: str


class WebsiteClientOut(BaseModel):
    """Schema de resposta (sem password)"""
    id: int
    name: str
    email: str
    phone: Optional[str] = None
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
