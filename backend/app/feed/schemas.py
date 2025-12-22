from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class FeedItemBase(BaseModel):
    type: str
    message: str
    created_at: datetime
    user_id: Optional[int] = None


class FeedItemCreate(FeedItemBase):
    pass


class FeedItemUpdate(FeedItemBase):
    pass


class FeedItemOut(FeedItemBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
