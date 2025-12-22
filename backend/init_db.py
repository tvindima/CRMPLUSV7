"""
Initialize database with all tables.
Run this once before applying migrations.
"""
import sys
from app.database import Base, engine

def init_db():
    """Create all tables defined in SQLAlchemy models."""
    print("🔨 Creating database tables...")
    
    # Import all models to register them with Base
    from app.agents.models import Agent
    from app.properties.models import Property
    from app.leads.models import Lead
    from app.calendar.models import Task
    from app.models.visit import Visit
    from app.models.event import Event
    from app.models.first_impression import FirstImpression
    from app.models.draft_ingestion import DraftProperty, IngestionFile
    from app.models.agent_site_preferences import AgentSitePreferences
    from app.users.refresh_token import RefreshToken
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")
    
    return 0

if __name__ == "__main__":
    sys.exit(init_db())
