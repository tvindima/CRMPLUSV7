from pydantic import BaseModel, ConfigDict
from typing import Optional


class TeamBase(BaseModel):
    name: str
    manager_id: Optional[int] = None
    agency_id: Optional[int] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamBase):
    pass


class TeamOut(TeamBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
