from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


SUPPORTED_PROVIDERS = ("imovirtual", "idealista", "olx", "casasapo")


class ProviderInfo(BaseModel):
    key: str
    label: str
    supports_feed: bool
    supports_api: bool


class PortalAccountUpsert(BaseModel):
    provider: Literal["imovirtual", "idealista", "olx", "casasapo"]
    mode: Literal["feed", "api"] = "feed"
    is_active: bool = False
    credentials_json: dict[str, Any] | None = None
    settings_json: dict[str, Any] | None = None


class PortalAccountOut(BaseModel):
    id: int
    provider: str
    mode: str
    is_active: bool
    settings_json: dict[str, Any] | None = None
    has_feed_token: bool = False
    feed_endpoint: str | None = None
    last_validated_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PortalRotateTokenOut(BaseModel):
    provider: str
    feed_url_once: str


class PortalListingOut(BaseModel):
    id: int
    property_id: int
    provider: str
    status: str
    external_listing_id: str | None = None
    last_error: str | None = None
    published_at: datetime | None = None
    updated_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortalSyncJobOut(BaseModel):
    id: int
    property_id: int
    provider: str
    action: str
    status: str
    attempt_count: int
    last_error: str | None = None
    scheduled_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_by_user_id: int | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class QueueSyncRequest(BaseModel):
    providers: list[Literal["imovirtual", "idealista", "olx", "casasapo"]] = Field(default_factory=list)
    action: Literal["publish", "unpublish", "refresh"] = "publish"


class QueueSyncResponse(BaseModel):
    queued_jobs: int
    jobs: list[PortalSyncJobOut]


class RunJobsResponse(BaseModel):
    attempted: int
    succeeded: int
    failed: int
    jobs: list[PortalSyncJobOut]
