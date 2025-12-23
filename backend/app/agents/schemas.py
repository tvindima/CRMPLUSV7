from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


class AgentBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    avatar_url: Optional[str] = None  # Deprecated
    photo: Optional[str] = None  # Cloudinary URL
    license_ami: Optional[str] = None
    bio: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None  # X.com
    tiktok: Optional[str] = None
    whatsapp: Optional[str] = None


class AgentCreate(AgentBase):
    team_id: Optional[int] = None
    agency_id: Optional[int] = None


class AgentUpdate(BaseModel):
    """Schema para atualização parcial de agente - todos campos opcionais"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    photo: Optional[str] = None
    license_ami: Optional[str] = None
    bio: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    tiktok: Optional[str] = None
    whatsapp: Optional[str] = None
    team_id: Optional[int] = None
    agency_id: Optional[int] = None


class AgentOut(AgentBase):
    id: int
    team_id: Optional[int] = None
    agency_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
