from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


class BillingPlanBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    currency: str = "EUR"


class BillingPlanCreate(BillingPlanBase):
    pass


class BillingPlanOut(BillingPlanBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class BillingRecordBase(BaseModel):
    agency_id: int
    plan_id: int
    amount: float
    currency: str = "EUR"
    paid_on: Optional[date] = None
    created_at: date


class BillingRecordCreate(BillingRecordBase):
    pass


class BillingRecordOut(BillingRecordBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
