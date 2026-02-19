from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from .models import PropertyStatus


class PropertyBase(BaseModel):
    reference: str = Field(..., description="Referência única do imóvel")
    title: str = Field(..., description="Título/curto da propriedade")
    business_type: Optional[str] = Field(None, description="Venda/Arrendamento")
    property_type: Optional[str] = None
    typology: Optional[str] = None
    description: Optional[str] = None
    observations: Optional[str] = None
    price: float
    usable_area: Optional[float] = None
    land_area: Optional[float] = None
    location: Optional[str] = None
    municipality: Optional[str] = None
    parish: Optional[str] = None
    condition: Optional[str] = None
    energy_certificate: Optional[str] = None
    images: Optional[List[str]] = None
    
    # Novos campos
    is_published: int = 1
    is_featured: int = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    video_url: Optional[str] = Field(None, max_length=500, description="URL do vídeo promocional")


class PropertyCreate(PropertyBase):
    status: PropertyStatus = PropertyStatus.AVAILABLE
    agent_id: Optional[int] = None


class PropertyUpdate(BaseModel):
    reference: Optional[str] = None
    title: Optional[str] = None
    business_type: Optional[str] = None
    property_type: Optional[str] = None
    typology: Optional[str] = None
    description: Optional[str] = None
    observations: Optional[str] = None
    price: Optional[float] = None
    usable_area: Optional[float] = None
    land_area: Optional[float] = None
    location: Optional[str] = None
    municipality: Optional[str] = None
    parish: Optional[str] = None
    condition: Optional[str] = None
    energy_certificate: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[PropertyStatus] = None
    agent_id: Optional[int] = None
    
    # Novos campos
    is_published: Optional[int] = None
    is_featured: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    parking_spaces: Optional[int] = None
    video_url: Optional[str] = Field(None, max_length=500)


class PropertyOut(PropertyBase):
    id: int
    status: PropertyStatus
    agent_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class PropertyDocumentOut(BaseModel):
    id: int
    property_id: int
    file_name: str
    file_url: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
