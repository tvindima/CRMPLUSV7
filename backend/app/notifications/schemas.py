from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    message: str
    recipient_id: Optional[int] = None
    delivered: bool = False
    created_at: datetime


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(NotificationBase):
    delivered: Optional[bool] = None


class NotificationOut(NotificationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
