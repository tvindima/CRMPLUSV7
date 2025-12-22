from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class LeadPropertyMatch(Base):
    __tablename__ = "lead_property_matches"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    score = Column(Float, nullable=False)  # score de correspondência
    created_at = Column(DateTime, nullable=False)

    lead = relationship("Lead")
    property = relationship("Property")
