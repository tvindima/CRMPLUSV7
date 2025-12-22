from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
import os
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.draft_ingestion import DraftProperty, IngestionFile
from app.schemas.draft_ingestion import DraftPropertyCreate, DraftPropertyOut, IngestionFileOut
import uuid
import shutil

# Worker import optional (requires Celery + Redis setup)
try:
    from worker import processamento_ia
    WORKER_AVAILABLE = True
except ImportError:
    WORKER_AVAILABLE = False
    processamento_ia = None

router = APIRouter(prefix="/ingestion", tags=["ingestion"])
UPLOAD_DIR = "media/ingestion_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/session", response_model=DraftPropertyOut)
def create_ingestion_session(
    payload: DraftPropertyCreate, db: Session = Depends(get_db)
):
    draft = DraftProperty(session_id=payload.session_id, status=payload.status, data=payload.data)
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft

@router.post("/upload/{session_id}", response_model=List[IngestionFileOut])
def upload_files(
    session_id: str,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    draft = db.query(DraftProperty).filter_by(session_id=session_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft session not found")
    results = []
    for file in files:
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        ingestion_file = IngestionFile(
            draft_property_id=draft.id,
            filename=file.filename,
            filetype=file.content_type,
            url=file_path,
        )
        db.add(ingestion_file)
        results.append(ingestion_file)
    db.commit()
    return results

@router.post("/process/{session_id}")
def trigger_processing(session_id: str, db: Session = Depends(get_db)):
    if not WORKER_AVAILABLE or processamento_ia is None:
        raise HTTPException(status_code=503, detail="Worker processing not available. Celery/Redis not configured.")
    draft = db.query(DraftProperty).filter_by(session_id=session_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft session not found")
    # Disparar task Celery
    result = processamento_ia.delay({"draft_id": draft.id, "session_id": session_id, "data": draft.data})
    return {"message": "Processing triggered", "session_id": session_id, "task_id": result.id}

@router.get("/status/{session_id}")
def get_processing_status(session_id: str, db: Session = Depends(get_db)):
    draft = db.query(DraftProperty).filter_by(session_id=session_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft session not found")
    return {"status": draft.status, "data": draft.data}

@router.post("/confirm/{session_id}")
def confirm_ingestion(session_id: str, db: Session = Depends(get_db)):
    draft = db.query(DraftProperty).filter_by(session_id=session_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft session not found")
    # Aqui seria feita a conversão para angariação final e mover assets
    draft.status = "confirmed"
    db.commit()
    return {"message": "Ingestion confirmed", "session_id": session_id}
