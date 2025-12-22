from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class BillingPlan(Base):
    __tablename__ = "billing_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    currency = Column(String, default="EUR")


class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"))
    plan_id = Column(Integer, ForeignKey("billing_plans.id"))
    amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    paid_on = Column(Date, nullable=True)
    created_at = Column(Date, nullable=False)
    agency = relationship("Agency")
    plan = relationship("BillingPlan")
