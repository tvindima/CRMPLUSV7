from __future__ import annotations

from datetime import datetime, timezone
from secrets import token_urlsafe
from xml.etree import ElementTree as ET

from sqlalchemy.orm import Session

from app.portals.models import PortalAccount, PortalListing, PortalSyncJob
from app.properties.models import Property

PROVIDER_LABELS = {
    "imovirtual": "Imovirtual",
    "idealista": "Idealista",
    "olx": "OLX",
    "casasapo": "Casa Sapo",
}

SUPPORTED_PROVIDERS = tuple(PROVIDER_LABELS.keys())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def list_providers() -> list[dict]:
    return [
        {
            "key": key,
            "label": label,
            "supports_feed": True,
            "supports_api": True,
        }
        for key, label in PROVIDER_LABELS.items()
    ]


def list_accounts(db: Session) -> list[PortalAccount]:
    return db.query(PortalAccount).order_by(PortalAccount.provider.asc()).all()


def get_account_by_provider(db: Session, provider: str) -> PortalAccount | None:
    return db.query(PortalAccount).filter(PortalAccount.provider == provider).first()


def upsert_account(
    db: Session,
    provider: str,
    mode: str,
    is_active: bool,
    credentials_json: dict | None,
    settings_json: dict | None,
) -> PortalAccount:
    account = get_account_by_provider(db, provider)
    now = _now()
    if not account:
        account = PortalAccount(
            provider=provider,
            mode=mode,
            is_active=is_active,
            credentials_json=credentials_json,
            settings_json=settings_json,
            feed_token=token_urlsafe(32),
            created_at=now,
            updated_at=now,
        )
        db.add(account)
    else:
        account.mode = mode
        account.is_active = is_active
        account.credentials_json = credentials_json
        account.settings_json = settings_json
        if not account.feed_token:
            account.feed_token = token_urlsafe(32)
        account.updated_at = now
    db.commit()
    db.refresh(account)
    return account


def rotate_feed_token(db: Session, provider: str) -> PortalAccount | None:
    account = get_account_by_provider(db, provider)
    if not account:
        return None
    account.feed_token = token_urlsafe(32)
    account.updated_at = _now()
    db.commit()
    db.refresh(account)
    return account


def list_portal_listings(db: Session, property_id: int | None = None) -> list[PortalListing]:
    query = db.query(PortalListing)
    if property_id:
        query = query.filter(PortalListing.property_id == property_id)
    return query.order_by(PortalListing.updated_at.desc(), PortalListing.id.desc()).all()


def get_property_or_none(db: Session, property_id: int) -> Property | None:
    return db.query(Property).filter(Property.id == property_id).first()


def queue_jobs(
    db: Session,
    property_id: int,
    providers: list[str],
    action: str,
    created_by_user_id: int | None,
) -> list[PortalSyncJob]:
    now = _now()
    jobs: list[PortalSyncJob] = []
    for provider in providers:
        existing = (
            db.query(PortalSyncJob)
            .filter(
                PortalSyncJob.property_id == property_id,
                PortalSyncJob.provider == provider,
                PortalSyncJob.action == action,
                PortalSyncJob.status.in_(["pending", "running"]),
            )
            .order_by(PortalSyncJob.id.desc())
            .first()
        )
        if existing:
            jobs.append(existing)
            continue

        job = PortalSyncJob(
            property_id=property_id,
            provider=provider,
            action=action,
            status="pending",
            attempt_count=0,
            scheduled_at=now,
            created_by_user_id=created_by_user_id,
            created_at=now,
            updated_at=now,
        )
        db.add(job)
        jobs.append(job)
    db.commit()
    for job in jobs:
        db.refresh(job)
    return jobs


def _build_portal_payload(property_obj: Property, provider: str) -> dict:
    return {
        "provider": provider,
        "property_id": property_obj.id,
        "reference": property_obj.reference,
        "title": property_obj.title,
        "business_type": property_obj.business_type,
        "property_type": property_obj.property_type,
        "typology": property_obj.typology,
        "description": property_obj.description,
        "price": property_obj.price,
        "usable_area": property_obj.usable_area,
        "land_area": property_obj.land_area,
        "location": property_obj.location,
        "municipality": property_obj.municipality,
        "parish": property_obj.parish,
        "condition": property_obj.condition,
        "energy_certificate": property_obj.energy_certificate,
        "status": property_obj.status,
        "images": property_obj.images or [],
        "updated_at": _now().isoformat(),
    }


def _get_or_create_listing(db: Session, property_id: int, provider: str) -> PortalListing:
    listing = (
        db.query(PortalListing)
        .filter(PortalListing.property_id == property_id, PortalListing.provider == provider)
        .first()
    )
    if listing:
        return listing
    now = _now()
    listing = PortalListing(
        property_id=property_id,
        provider=provider,
        status="pending",
        created_at=now,
        updated_at=now,
    )
    db.add(listing)
    db.flush()
    return listing


def process_job(db: Session, job: PortalSyncJob) -> PortalSyncJob:
    now = _now()
    job.status = "running"
    job.started_at = now
    job.attempt_count = (job.attempt_count or 0) + 1
    job.updated_at = now
    db.flush()

    account = get_account_by_provider(db, job.provider)
    listing = _get_or_create_listing(db, job.property_id, job.provider)
    property_obj = get_property_or_none(db, job.property_id)

    if not property_obj:
        err = "Property not found"
        job.status = "failed"
        job.last_error = err
        job.completed_at = _now()
        listing.status = "failed"
        listing.last_error = err
        listing.updated_at = _now()
        db.commit()
        db.refresh(job)
        return job

    if not account or not account.is_active:
        err = "Provider account is missing or inactive"
        job.status = "failed"
        job.last_error = err
        job.completed_at = _now()
        listing.status = "failed"
        listing.last_error = err
        listing.updated_at = _now()
        db.commit()
        db.refresh(job)
        return job

    payload = _build_portal_payload(property_obj, job.provider)
    listing.last_payload_json = payload

    # Safe rollout behavior:
    # - feed mode marks as published/unpublished in CRM export registry.
    # - api mode is reserved for direct connector implementation.
    if account.mode == "api":
        err = "Direct API connector not configured for this provider yet. Use feed mode."
        job.status = "failed"
        job.last_error = err
        job.completed_at = _now()
        listing.status = "failed"
        listing.last_error = err
        listing.last_response_json = {"error": err}
        listing.updated_at = _now()
        db.commit()
        db.refresh(job)
        return job

    if job.action in {"publish", "refresh"}:
        listing.status = "published"
        listing.last_error = None
        listing.external_listing_id = listing.external_listing_id or f"{job.provider}-{job.property_id}"
        listing.published_at = _now()
        listing.last_response_json = {"result": "accepted_for_feed_export"}
    elif job.action == "unpublish":
        listing.status = "unpublished"
        listing.last_error = None
        listing.last_response_json = {"result": "marked_unpublished"}
    else:
        err = f"Unsupported action: {job.action}"
        job.status = "failed"
        job.last_error = err
        job.completed_at = _now()
        listing.status = "failed"
        listing.last_error = err
        listing.last_response_json = {"error": err}
        listing.updated_at = _now()
        db.commit()
        db.refresh(job)
        return job

    listing.updated_at = _now()
    job.status = "success"
    job.last_error = None
    job.completed_at = _now()
    job.updated_at = _now()
    db.commit()
    db.refresh(job)
    return job


def run_pending_jobs(db: Session, limit: int = 50) -> list[PortalSyncJob]:
    jobs = (
        db.query(PortalSyncJob)
        .filter(PortalSyncJob.status == "pending")
        .order_by(PortalSyncJob.scheduled_at.asc(), PortalSyncJob.id.asc())
        .limit(limit)
        .all()
    )
    processed: list[PortalSyncJob] = []
    for job in jobs:
        processed.append(process_job(db, job))
    return processed


def run_single_job(db: Session, job_id: int) -> PortalSyncJob | None:
    job = db.query(PortalSyncJob).filter(PortalSyncJob.id == job_id).first()
    if not job:
        return None
    return process_job(db, job)


def list_jobs(db: Session, status: str | None = None, limit: int = 100) -> list[PortalSyncJob]:
    query = db.query(PortalSyncJob).order_by(PortalSyncJob.created_at.desc(), PortalSyncJob.id.desc())
    if status:
        query = query.filter(PortalSyncJob.status == status)
    return query.limit(limit).all()


def _as_text(value) -> str:
    return "" if value is None else str(value)


def build_feed_xml(db: Session, provider: str) -> str:
    root = ET.Element("crmplus_feed")
    ET.SubElement(root, "provider").text = provider
    ET.SubElement(root, "generated_at").text = _now().isoformat()

    listings = (
        db.query(PortalListing, Property)
        .join(Property, Property.id == PortalListing.property_id)
        .filter(
            PortalListing.provider == provider,
            PortalListing.status == "published",
        )
        .order_by(PortalListing.updated_at.desc(), PortalListing.id.desc())
        .all()
    )

    items_el = ET.SubElement(root, "properties")
    for listing, prop in listings:
        item = ET.SubElement(items_el, "property")
        ET.SubElement(item, "id").text = _as_text(prop.id)
        ET.SubElement(item, "reference").text = _as_text(prop.reference)
        ET.SubElement(item, "external_listing_id").text = _as_text(listing.external_listing_id)
        ET.SubElement(item, "title").text = _as_text(prop.title)
        ET.SubElement(item, "business_type").text = _as_text(prop.business_type)
        ET.SubElement(item, "property_type").text = _as_text(prop.property_type)
        ET.SubElement(item, "typology").text = _as_text(prop.typology)
        ET.SubElement(item, "description").text = _as_text(prop.description)
        ET.SubElement(item, "price").text = _as_text(prop.price)
        ET.SubElement(item, "usable_area").text = _as_text(prop.usable_area)
        ET.SubElement(item, "land_area").text = _as_text(prop.land_area)
        ET.SubElement(item, "location").text = _as_text(prop.location)
        ET.SubElement(item, "municipality").text = _as_text(prop.municipality)
        ET.SubElement(item, "parish").text = _as_text(prop.parish)
        ET.SubElement(item, "condition").text = _as_text(prop.condition)
        ET.SubElement(item, "energy_certificate").text = _as_text(prop.energy_certificate)
        ET.SubElement(item, "status").text = _as_text(prop.status)
        ET.SubElement(item, "published_at").text = _as_text(listing.published_at)

        images_el = ET.SubElement(item, "images")
        for image_url in (prop.images or []):
            ET.SubElement(images_el, "image").text = _as_text(image_url)

    return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
