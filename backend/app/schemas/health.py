from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    service: str
    status: str
    timestamp: datetime
