from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class IngestionFileBase(BaseModel):
    filename: str
    filetype: str
    url: Optional[str] = None
    status: Optional[str] = "uploaded"
    meta: Optional[Dict[str, Any]] = {}

class IngestionFileCreate(IngestionFileBase):
    pass

class IngestionFileOut(IngestionFileBase):
    id: int
    draft_property_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DraftPropertyBase(BaseModel):
    session_id: str
    status: Optional[str] = "pending"
    data: Optional[Dict[str, Any]] = {}

class DraftPropertyCreate(DraftPropertyBase):
    pass

class DraftPropertyOut(DraftPropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    ingestion_files: List[IngestionFileOut] = []

    model_config = ConfigDict(from_attributes=True)
