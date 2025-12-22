from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class LeadPropertyMatchBase(BaseModel):
    lead_id: int
    property_id: int
    score: float
    created_at: datetime


class LeadPropertyMatchCreate(LeadPropertyMatchBase):
    pass


class LeadPropertyMatchOut(LeadPropertyMatchBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
