from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import DEFAULT_SCHEMA, get_db, get_tenant_schema
from app.portals import schemas, services
from app.security import require_staff
from app.users.models import User

router = APIRouter(prefix="/portals", tags=["portals"])
MANAGEMENT_ROLES = {"admin", "staff", "leader", "coordinator"}


def _ensure_portal_management_access(user: User) -> None:
    if user.role not in MANAGEMENT_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient role for portal management")


@router.get("/providers", response_model=list[schemas.ProviderInfo])
def list_providers(current_user: User = Depends(require_staff)):
    _ensure_portal_management_access(current_user)
    return services.list_providers()


@router.get("/accounts", response_model=list[schemas.PortalAccountOut])
def list_accounts(db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    _ensure_portal_management_access(current_user)
    accounts = services.list_accounts(db)
    output: list[schemas.PortalAccountOut] = []
    for account in accounts:
        item = schemas.PortalAccountOut(
            id=account.id,
            provider=account.provider,
            mode=account.mode,
            is_active=account.is_active,
            settings_json=account.settings_json,
            has_feed_token=bool(account.feed_token),
            feed_endpoint=f"/portals/feeds/{account.provider}.xml",
            last_validated_at=account.last_validated_at,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )
        output.append(item)
    return output


@router.put("/accounts/{provider}", response_model=schemas.PortalAccountOut)
def upsert_account(
    provider: str,
    payload: schemas.PortalAccountUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    _ensure_portal_management_access(current_user)
    if provider not in schemas.SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    if provider != payload.provider:
        raise HTTPException(status_code=400, detail="Provider path and payload mismatch")
    account = services.upsert_account(
        db=db,
        provider=provider,
        mode=payload.mode,
        is_active=payload.is_active,
        credentials_json=payload.credentials_json,
        settings_json=payload.settings_json,
    )
    return schemas.PortalAccountOut(
        id=account.id,
        provider=account.provider,
        mode=account.mode,
        is_active=account.is_active,
        settings_json=account.settings_json,
        has_feed_token=bool(account.feed_token),
        feed_endpoint=f"/portals/feeds/{account.provider}.xml",
        last_validated_at=account.last_validated_at,
        created_at=account.created_at,
        updated_at=account.updated_at,
    )


@router.post("/accounts/{provider}/rotate-token", response_model=schemas.PortalRotateTokenOut)
def rotate_feed_token(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    _ensure_portal_management_access(current_user)
    account = services.rotate_feed_token(db, provider)
    if not account:
        raise HTTPException(status_code=404, detail="Portal account not found")
    base_url = str(request.base_url).rstrip("/")
    return schemas.PortalRotateTokenOut(
        provider=account.provider,
        feed_url_once=f"{base_url}/portals/feeds/{account.provider}.xml?token={account.feed_token}",
    )


@router.get("/listings", response_model=list[schemas.PortalListingOut])
def list_portal_listings(
    property_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    _ensure_portal_management_access(current_user)
    return services.list_portal_listings(db, property_id=property_id)


@router.post("/properties/{property_id}/queue", response_model=schemas.QueueSyncResponse)
def queue_property_sync(
    property_id: int,
    payload: schemas.QueueSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    _ensure_portal_management_access(current_user)
    property_obj = services.get_property_or_none(db, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    providers = payload.providers or list(schemas.SUPPORTED_PROVIDERS)
    invalid = [p for p in providers if p not in schemas.SUPPORTED_PROVIDERS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unsupported providers: {', '.join(invalid)}")

    jobs = services.queue_jobs(
        db=db,
        property_id=property_id,
        providers=providers,
        action=payload.action,
        created_by_user_id=current_user.id,
    )
    return schemas.QueueSyncResponse(
        queued_jobs=len(jobs),
        jobs=[schemas.PortalSyncJobOut.model_validate(job) for job in jobs],
    )


@router.get("/jobs", response_model=list[schemas.PortalSyncJobOut])
def list_sync_jobs(
    status: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    _ensure_portal_management_access(current_user)
    return services.list_jobs(db, status=status, limit=limit)


@router.post("/jobs/run-pending", response_model=schemas.RunJobsResponse)
def run_pending_jobs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    _ensure_portal_management_access(current_user)
    jobs = services.run_pending_jobs(db, limit=limit)
    succeeded = sum(1 for job in jobs if job.status == "success")
    failed = sum(1 for job in jobs if job.status == "failed")
    return schemas.RunJobsResponse(
        attempted=len(jobs),
        succeeded=succeeded,
        failed=failed,
        jobs=[schemas.PortalSyncJobOut.model_validate(job) for job in jobs],
    )


@router.post("/jobs/{job_id}/run", response_model=schemas.PortalSyncJobOut)
def run_single_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_staff)):
    _ensure_portal_management_access(current_user)
    job = services.run_single_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return schemas.PortalSyncJobOut.model_validate(job)


@router.get("/feeds/{provider}.xml")
def get_provider_feed(provider: str, token: str = Query(...), db: Session = Depends(get_db)):
    schema = get_tenant_schema()
    if not schema or schema == DEFAULT_SCHEMA:
        raise HTTPException(status_code=400, detail="Tenant context is required for portal feed")

    if provider not in schemas.SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=404, detail="Provider not found")

    account = services.get_account_by_provider(db, provider)
    if not account or not account.is_active:
        raise HTTPException(status_code=404, detail="Feed not available")
    if not account.feed_token or token != account.feed_token:
        raise HTTPException(status_code=403, detail="Invalid feed token")

    xml_data = services.build_feed_xml(db, provider)
    return Response(content=xml_data, media_type="application/xml")
