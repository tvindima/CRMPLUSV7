from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)

from app.database import Base


class PortalAccount(Base):
    __tablename__ = "portal_accounts"
    __table_args__ = (UniqueConstraint("provider", name="uq_portal_accounts_provider"),)

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False, index=True)  # idealista, imovirtual, olx, casasapo
    mode = Column(String(20), nullable=False, default="feed")  # feed or api
    is_active = Column(Boolean, nullable=False, default=False)
    feed_token = Column(String(120), nullable=True, unique=True, index=True)
    credentials_json = Column(JSON, nullable=True)
    settings_json = Column(JSON, nullable=True)
    last_validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)


class PortalListing(Base):
    __tablename__ = "portal_listings"
    __table_args__ = (
        UniqueConstraint("property_id", "provider", name="uq_portal_listings_property_provider"),
    )

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending/published/failed/unpublished
    external_listing_id = Column(String(120), nullable=True)
    last_error = Column(Text, nullable=True)
    last_payload_json = Column(JSON, nullable=True)
    last_response_json = Column(JSON, nullable=True)
    published_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False)


class PortalSyncJob(Base):
    __tablename__ = "portal_sync_jobs"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)
    action = Column(String(20), nullable=False)  # publish/unpublish/refresh
    status = Column(String(20), nullable=False, default="pending")  # pending/running/success/failed
    attempt_count = Column(Integer, nullable=False, default=0)
    last_error = Column(Text, nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_by_user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)

