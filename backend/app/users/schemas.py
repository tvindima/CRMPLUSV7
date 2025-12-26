from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional
from datetime import datetime
from .models import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.AGENT
    agent_id: Optional[int] = None
    works_for_agent_id: Optional[int] = None  # Para assistentes: agente responsável


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    agent_id: Optional[int] = None
    works_for_agent_id: Optional[int] = None


class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserOut(UserBase):
    id: int
    role: UserRole
    is_active: bool
    agent_id: Optional[int]
    works_for_agent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserWithAgent(UserOut):
    """User com informações do agente associado"""
    agent_name: Optional[str] = None
    agent_email: Optional[str] = None
    works_for_agent_name: Optional[str] = None  # Nome do agente para quem trabalha
