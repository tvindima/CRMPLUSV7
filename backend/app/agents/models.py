from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

if TYPE_CHECKING:
    from app.properties.models import Property


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)  # Deprecated - usar photo
    photo = Column(String, nullable=True)  # Cloudinary URL
    license_ami = Column(String(50), nullable=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=True)
    
    # Bio e Redes Sociais
    bio = Column(Text, nullable=True)
    instagram = Column(String(255), nullable=True)
    facebook = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    
    # Relationships
    properties = relationship("Property", back_populates="agent")
    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
    managed_teams = relationship("Team", back_populates="manager", foreign_keys="Team.manager_id")
    agency = relationship("Agency", back_populates="agents")
    leads = relationship("Lead", back_populates="assigned_agent")
    tasks = relationship("Task", back_populates="assigned_agent", foreign_keys="Task.assigned_agent_id")
    visits = relationship("Visit", back_populates="agent_obj")
    events = relationship("Event", back_populates="agent", cascade="all, delete-orphan")
    first_impressions = relationship("FirstImpression", back_populates="agent", cascade="all, delete-orphan")

