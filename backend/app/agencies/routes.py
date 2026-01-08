from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import services, schemas
from app.database import get_db
from app.security import get_current_user
from app.users.models import User

router = APIRouter(prefix="/agencies", tags=["agencies"])


@router.get("/", response_model=list[schemas.AgencyOut])
def list_agencies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_agencies(db, skip=skip, limit=limit)


@router.get("/{agency_id}", response_model=schemas.AgencyOut)
def get_agency(agency_id: int, db: Session = Depends(get_db)):
    agency = services.get_agency(db, agency_id)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.post("/", response_model=schemas.AgencyOut, status_code=201)
def create_agency(agency: schemas.AgencyCreate, db: Session = Depends(get_db)):
    return services.create_agency(db, agency)


@router.put("/{agency_id}", response_model=schemas.AgencyOut)
def update_agency(agency_id: int, agency_update: schemas.AgencyUpdate, db: Session = Depends(get_db)):
    agency = services.update_agency(db, agency_id, agency_update)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.put("/{agency_id}/cmi-settings", response_model=schemas.AgencyOut)
def update_agency_cmi_settings(
    agency_id: int, 
    agency_update: schemas.AgencyUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar configurações de CMI da agência.
    APENAS admin ou coordenador podem editar.
    """
    # Verificar role do utilizador
    allowed_roles = ["admin", "coordenador", "super_admin"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403, 
            detail="Apenas admin ou coordenador podem editar configurações de CMI"
        )
    
    # Verificar se utilizador pertence a esta agência (se não for super_admin)
    if current_user.role != "super_admin":
        # Obter agent_id do utilizador
        from app.agents.models import Agent
        agent = db.query(Agent).filter(Agent.id == current_user.agent_id).first()
        if not agent or agent.agency_id != agency_id:
            raise HTTPException(
                status_code=403,
                detail="Não tem permissão para editar esta agência"
            )
    
    agency = services.update_agency(db, agency_id, agency_update)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.delete("/{agency_id}", response_model=schemas.AgencyOut)
def delete_agency(agency_id: int, db: Session = Depends(get_db)):
    agency = services.delete_agency(db, agency_id)
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency
