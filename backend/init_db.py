"""
Initialize database with all tables.
Run this once before applying migrations.
"""
import sys
from app.database import Base, engine

def init_db():
    """Create all tables defined in SQLAlchemy models."""
    print("🔨 Creating database tables...")
    
    # Import ALL models to register them with Base
    # Core models
    from app.users.models import User
    from app.agents.models import Agent
    from app.properties.models import Property
    from app.leads.models import Lead
    from app.calendar.models import Task, CalendarEvent
    from app.users.refresh_token import RefreshToken
    
    # Extended models
    from app.models.visit import Visit
    from app.models.event import Event
    from app.models.first_impression import FirstImpression
    from app.models.draft_ingestion import DraftProperty, IngestionFile
    from app.models.agent_site_preferences import AgentSitePreferences
    
    # Business/Legal models
    from app.models.contrato_mediacao import ContratoMediacaoImovel
    from app.models.pre_angariacao import PreAngariacao
    from app.models.crm_settings import CRMSettings
    from app.models.website_client import WebsiteClient
    
    # Organization models
    from app.teams.models import Team
    from app.agencies.models import Agency
    
    # Activity models
    from app.feed.models import FeedItem
    from app.notifications.models import Notification
    
    # Business models
    from app.billing.models import BillingPlan, BillingRecord
    from app.match_plus.models import LeadPropertyMatch
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    print("📊 Total models registered: 25")
    
    return 0

if __name__ == "__main__":
    sys.exit(init_db())
