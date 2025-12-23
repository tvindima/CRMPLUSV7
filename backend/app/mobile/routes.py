"""
Rotas API para aplicação móvel - Agentes Editores
Endpoints otimizados para app mobile com permissões completas de agente
"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import math

from app.database import get_db
from app.security import get_current_user
from app.users.models import User, UserRole

# Importar modelos e schemas
from app.properties.models import Property, PropertyStatus
from app.properties import schemas as property_schemas
from app.agents.models import Agent
from app.agents import schemas as agent_schemas
from app.leads.models import Lead, LeadStatus, LeadSource  # ✅ Adicionar LeadSource
from app.leads import schemas as lead_schemas
from app.calendar.models import Task, TaskStatus, TaskPriority
from app.calendar import schemas as task_schemas
from app.schemas import visit as visit_schemas
from app.models.visit import Visit, VisitStatus, InterestLevel
from app.models.event import Event
from app.schemas import event as event_schemas
from app.schemas import site_preferences as site_prefs_schemas
from app.models.agent_site_preferences import AgentSitePreferences
from app.core.storage import storage
import calendar as cal_module
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mobile", tags=["Mobile App"])

# Version para debug de deploy
MOBILE_API_VERSION = "2025-01-01-v18-persist-site-preferences"

@router.get("/version")
def get_mobile_version():
    """Verificar versão do código mobile routes"""
    return {"version": MOBILE_API_VERSION}


# =====================================================
# AUTHENTICATION & PROFILE
# =====================================================

@router.get("/auth/me", response_model=dict)
def get_mobile_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter perfil completo do agente para app mobile
    Inclui informações do usuário e dados do agente associado
    """
    agent_data = None
    if current_user.agent_id:
        agent = db.query(Agent).filter(Agent.id == current_user.agent_id).first()
        if agent:
            agent_data = {
                "id": agent.id,
                "name": agent.name,
                "email": agent.email,
                "phone": agent.phone,
                "photo": agent.photo,
                "avatar_url": agent.avatar_url,
                "license_ami": getattr(agent, 'license_ami', None),
                "bio": getattr(agent, 'bio', None),
                "instagram": getattr(agent, 'instagram', None),
                "facebook": getattr(agent, 'facebook', None),
                "linkedin": getattr(agent, 'linkedin', None),
                "whatsapp": getattr(agent, 'whatsapp', None),
            }
    
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "avatar_url": current_user.avatar_url,
            "phone": current_user.phone,
            "is_active": current_user.is_active,
        },
        "agent": agent_data,
        "permissions": {
            "can_create_property": True,
            "can_edit_property": True,
            "can_delete_property": current_user.role in [UserRole.ADMIN.value, UserRole.COORDINATOR.value],
            "can_manage_leads": True,
            "can_manage_tasks": True,
            "can_upload_photos": True,
            "can_update_status": True,
        }
    }


# =====================================================
# PROPERTIES - CRUD COMPLETO
# =====================================================

@router.get("/properties", response_model=List[property_schemas.PropertyOut])
def list_mobile_properties(
    skip: int = 0,
    limit: int = 500,
    per_page: Optional[int] = None,  # Alias para limit
    sort: Optional[str] = None,  # price_asc, price_desc, recent
    status: Optional[str] = None,
    business_type: Optional[str] = None,
    property_type: Optional[str] = None,
    search: Optional[str] = None,
    my_properties: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar propriedades para app mobile
    - Suporta filtros por status, tipo, busca
    - Opção de mostrar apenas propriedades do agente (my_properties=true)
    - per_page: alias para limit
    - sort: price_asc, price_desc, recent (default)
    """
    # per_page é alias para limit
    if per_page is not None:
        limit = per_page
    
    query = db.query(Property)
    
    # Filtrar apenas propriedades do agente atual
    if my_properties:
        if not current_user.agent_id:
            # Se my_properties=true mas utilizador não tem agent_id, retornar lista vazia
            return []
        query = query.filter(Property.agent_id == current_user.agent_id)
    
    # Filtros
    if status:
        query = query.filter(Property.status == status)
    if business_type:
        query = query.filter(Property.business_type == business_type)
    if property_type:
        query = query.filter(Property.property_type == property_type)
    
    # Busca por texto
    if search:
        query = query.filter(
            or_(
                Property.reference.ilike(f"%{search}%"),
                Property.location.ilike(f"%{search}%"),
                Property.municipality.ilike(f"%{search}%"),
                Property.description.ilike(f"%{search}%"),
            )
        )
    
    # Ordenação
    if sort == "price_asc":
        query = query.order_by(Property.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.price.desc())
    else:  # recent (default)
        query = query.order_by(desc(Property.created_at))
    
    return query.offset(skip).limit(limit).all()


@router.get("/properties/{property_id}", response_model=property_schemas.PropertyOut)
def get_mobile_property(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de uma propriedade"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    return property


@router.post("/properties", response_model=property_schemas.PropertyOut, status_code=201)
def create_mobile_property(
    property: property_schemas.PropertyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar nova propriedade via app mobile
    Atribui automaticamente ao agente atual
    """
    # Atribuir ao agente do usuário atual
    property_data = property.dict()
    if current_user.agent_id:
        property_data['agent_id'] = current_user.agent_id
    
    new_property = Property(**property_data)
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    
    return new_property


@router.put("/properties/{property_id}", response_model=property_schemas.PropertyOut)
def update_mobile_property(
    property_id: int,
    property_update: property_schemas.PropertyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar propriedade via app mobile
    Agentes só podem editar suas próprias propriedades
    Admin/Coordenador podem editar qualquer uma
    """
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if property.agent_id != current_user.agent_id:
            raise HTTPException(
                status_code=403, 
                detail="Você só pode editar suas próprias propriedades"
            )
    
    # Atualizar campos
    for field, value in property_update.dict(exclude_unset=True).items():
        setattr(property, field, value)
    
    property.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(property)
    
    return property


@router.patch("/properties/{property_id}/status")
def update_property_status_mobile(
    property_id: int,
    status: PropertyStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar rapidamente o status de uma propriedade"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if property.agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    property.status = status.value
    property.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "status": property.status}


@router.post("/properties/{property_id}/photos/upload")
async def upload_property_photo_mobile(
    property_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload de foto de propriedade via app mobile
    Otimizado para uploads mobile com validação de tamanho
    """
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if property.agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Validar tipo de arquivo
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=415, detail="Apenas imagens são permitidas")
    
    # Validar tamanho (máx 10MB para mobile)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Imagem muito grande (máx 10MB)")
    
    try:
        # Upload para storage (Cloudinary)
        file_key = f"properties/{property_id}/{file.filename}"
        url = storage.upload_file(content, file_key, content_type=file.content_type)
        
        # Adicionar URL às fotos da propriedade
        if property.photos:
            photos_list = property.photos.split(',') if isinstance(property.photos, str) else []
            photos_list.append(url)
            property.photos = ','.join(photos_list)
        else:
            property.photos = url
        
        property.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "url": url,
            "property_id": property_id,
            "total_photos": len(property.photos.split(',')) if property.photos else 1
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no upload: {str(e)}")


@router.post("/properties/{property_id}/photos/bulk")
async def upload_property_photos_bulk(
    property_id: int,
    photos: List[dict],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload em massa de fotos via URLs Cloudinary
    
    Mobile app faz upload direto para Cloudinary (client-side),
    depois envia array de URLs para backend salvar na database.
    
    Body: {"photos": [{"url": "https://res.cloudinary.com/.../photo1.jpg"}, ...]}
    """
    import os
    
    # 1. Validar propriedade existe
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    # 2. Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if property.agent_id != current_user.agent_id:
            raise HTTPException(
                status_code=403, 
                detail="Agente não tem permissão sobre esta propriedade"
            )
    
    # 3. Validar URLs são do Cloudinary correto
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dtpk4oqoa")
    valid_urls = []
    
    for photo in photos:
        url = photo.get("url", "")
        
        # Validação segurança: apenas URLs do nosso Cloudinary
        if f"res.cloudinary.com/{cloud_name}" not in url:
            raise HTTPException(
                status_code=400,
                detail=f"URL inválida. Apenas URLs do Cloudinary {cloud_name} são permitidas."
            )
        
        valid_urls.append(url)
    
    if not valid_urls:
        raise HTTPException(status_code=400, detail="Nenhuma URL válida fornecida")
    
    # 4. Adicionar URLs à propriedade
    try:
        if property.photos:
            existing_photos = property.photos.split(',') if isinstance(property.photos, str) else []
            all_photos = existing_photos + valid_urls
            property.photos = ','.join(all_photos)
        else:
            property.photos = ','.join(valid_urls)
        
        property.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(property)
        
        total_photos = len(property.photos.split(',')) if property.photos else 0
        
        return {
            "success": True,
            "property_id": property_id,
            "photos_uploaded": len(valid_urls),
            "total_photos": total_photos,
            "urls": valid_urls
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar fotos: {str(e)}")


@router.get("/cloudinary/upload-config")
def get_cloudinary_upload_config(current_user: User = Depends(get_current_user)):
    """
    Retorna configuração para upload direto do mobile para Cloudinary
    
    App usa estas configs para fazer upload client-side antes de 
    enviar URLs para o endpoint /photos/bulk
    """
    import os
    
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "dtpk4oqoa")
    upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET_MOBILE", "crm-plus-mobile")
    
    return {
        "cloud_name": cloud_name,
        "upload_preset": upload_preset,
        "api_base_url": f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        "folder": "crm-plus/mobile-uploads",
        "max_file_size_mb": 10,
        "allowed_formats": ["jpg", "jpeg", "png", "heic", "webp"]
    }


# =====================================================
# LEADS - GESTÃO COMPLETA
# =====================================================

@router.get("/leads", response_model=List[lead_schemas.LeadOut])
def list_mobile_leads(
    skip: int = 0,
    limit: int = 500,
    status: Optional[str] = None,
    my_leads: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar leads para app mobile
    Por padrão mostra apenas leads do agente (my_leads=true)
    
    Args:
        status: Status único ou múltiplos separados por vírgula
                Exemplos: "new" ou "contacted,qualified,negotiation"
    """
    query = db.query(Lead)
    
    # Filtrar leads do agente atual
    if my_leads and current_user.agent_id:
        query = query.filter(Lead.assigned_agent_id == current_user.agent_id)
    
    # Filtro por status (suportar múltiplos valores)
    if status:
        # Split por vírgula e limpar espaços
        status_list = [s.strip() for s in status.split(',') if s.strip()]
        
        # Converter strings para LeadStatus enum
        if len(status_list) > 0:
            try:
                # Converter todos para enum de uma vez
                status_enums = [LeadStatus(s) for s in status_list]
                # Usar in_() para lista ou comparação direta para único
                if len(status_enums) == 1:
                    query = query.filter(Lead.status == status_enums[0])
                else:
                    query = query.filter(Lead.status.in_(status_enums))
            except ValueError:
                # Status inválido - retornar lista vazia
                return []
    
    # Ordenar por mais recentes/urgentes
    query = query.order_by(desc(Lead.created_at))
    
    try:
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        # Log do erro real
        import traceback
        traceback.print_exc()
        raise


@router.get("/leads/{lead_id}", response_model=lead_schemas.LeadOut)
def get_mobile_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de um lead"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    
    # Verificar se o lead pertence ao agente
    if current_user.role == UserRole.AGENT.value:
        if lead.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    return lead


@router.patch("/leads/{lead_id}/status")
def update_lead_status_mobile(
    lead_id: int,
    status: LeadStatus,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar status de um lead"""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if lead.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    lead.status = status.value
    if notes:
        lead.notes = notes
    lead.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"success": True, "status": lead.status}


@router.put("/leads/{lead_id}", response_model=lead_schemas.LeadOut)
def update_lead_mobile(
    lead_id: int,
    lead_update: lead_schemas.LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar informações completas de um lead
    Permite alterar nome, telefone, email, orçamento, notas, status
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if lead.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Atualizar campos fornecidos
    update_data = lead_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
    
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    
    return lead


@router.post("/leads/{lead_id}/contact")
def register_lead_contact_mobile(
    lead_id: int,
    contact_type: str = Query(..., description="Tipo: call, email, whatsapp, visit"),
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Registrar contacto com lead
    Útil para histórico de interações
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if lead.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Registrar última interação
    lead.last_contact_date = datetime.utcnow()
    if notes:
        current_notes = lead.notes or ""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        lead.notes = f"{current_notes}\n[{timestamp}] {contact_type.upper()}: {notes}"
    
    lead.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "lead_id": lead_id,
        "contact_type": contact_type,
        "last_contact": lead.last_contact_date
    }


@router.put("/leads/{lead_id}/convert", response_model=lead_schemas.LeadOut)
def convert_lead_to_client(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Converter lead em cliente
    - Atualiza status para CONVERTED
    - Registra nos notes a data de conversão
    """
    # Buscar lead
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if lead.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão para converter esta lead")
    
    # Converter
    lead.status = LeadStatus.CONVERTED.value
    lead.updated_at = datetime.utcnow()
    
    # Adicionar nota de conversão (já que não temos campo converted_at)
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    current_notes = lead.notes or ""
    lead.notes = f"{current_notes}\n[{timestamp}] CONVERTED: Lead convertida em cliente por {current_user.full_name or current_user.email}"
    
    db.commit()
    db.refresh(lead)
    
    return lead


# =====================================================
# TASKS - GESTÃO DE TAREFAS
# =====================================================

@router.get("/tasks", response_model=List[task_schemas.TaskOut])
def list_mobile_tasks(
    skip: int = 0,
    limit: int = 500,
    status: Optional[str] = None,
    my_tasks: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar tarefas para app mobile
    Por padrão mostra apenas tarefas do agente
    """
    query = db.query(Task)
    
    # Filtrar tarefas do agente atual
    if my_tasks and current_user.agent_id:
        query = query.filter(Task.assigned_agent_id == current_user.agent_id)
    
    # Filtro por status
    if status:
        query = query.filter(Task.status == status)
    
    # Ordenar por data de vencimento
    query = query.order_by(Task.due_date.asc())
    
    return query.offset(skip).limit(limit).all()


@router.get("/tasks/today")
def get_tasks_today_mobile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter tarefas de hoje - widget para app mobile"""
    if not current_user.agent_id:
        return {"tasks": [], "count": 0}
    
    today = datetime.utcnow().date()
    
    tasks = db.query(Task).filter(
        and_(
            Task.assigned_agent_id == current_user.agent_id,
            func.date(Task.due_date) == today,
            Task.status != TaskStatus.COMPLETED.value
        )
    ).order_by(Task.due_date).all()
    
    return {
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "due_date": t.due_date,
                "status": t.status,
                "priority": t.priority,
            }
            for t in tasks
        ],
        "count": len(tasks),
        "date": today.isoformat()
    }


@router.post("/tasks", response_model=task_schemas.TaskOut, status_code=201)
def create_mobile_task(
    task: task_schemas.TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar nova tarefa via app mobile"""
    task_data = task.dict()
    
    # Atribuir ao agente atual se não especificado
    if not task_data.get('agent_id') and current_user.agent_id:
        task_data['agent_id'] = current_user.agent_id
    
    new_task = Task(**task_data)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    return new_task


@router.patch("/tasks/{task_id}/status")
def update_task_status_mobile(
    task_id: int,
    status: TaskStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar status de tarefa"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if task.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    task.status = status.value
    if status == TaskStatus.COMPLETED:
        task.completed_at = datetime.utcnow()
    
    task.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "status": task.status}


@router.get("/tasks/{task_id}", response_model=task_schemas.TaskOut)
def get_task_detail_mobile(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de uma task específica"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if task.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão para ver esta tarefa")
    
    return task


@router.put("/tasks/{task_id}", response_model=task_schemas.TaskOut)
def update_task_complete_mobile(
    task_id: int,
    task_update: task_schemas.TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar task completa (título, descrição, data, prioridade, etc)
    Aceita atualização parcial (apenas campos enviados)
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if task.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão para editar esta tarefa")
    
    # Atualizar campos enviados (exclude_unset=True ignora campos não enviados)
    for field, value in task_update.dict(exclude_unset=True).items():
        setattr(task, field, value)
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task_mobile(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletar task
    Retorna 204 No Content em caso de sucesso
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if task.assigned_agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão para deletar esta tarefa")
    
    db.delete(task)
    db.commit()
    
    return None  # 204 No Content não retorna body


# =====================================================
# DASHBOARD & STATS
# =====================================================

@router.get("/dashboard/stats")
def get_mobile_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Estatísticas do dashboard para app mobile
    Dados resumidos do agente - v2 simplificado
    """
    # Valores default
    properties_count = 0
    leads_count = 0
    tasks_pending = 0
    tasks_today = 0
    
    try:
        # Contar propriedades
        if current_user.agent_id:
            properties_count = db.query(Property).filter(
                Property.agent_id == current_user.agent_id
            ).count()
        else:
            properties_count = db.query(Property).count()
    except Exception as e:
        print(f"[STATS] Error counting properties: {e}")
    
    try:
        # Contar leads ativos
        if current_user.agent_id:
            leads_count = db.query(Lead).filter(
                Lead.assigned_agent_id == current_user.agent_id
            ).count()
    except Exception as e:
        print(f"[STATS] Error counting leads: {e}")
    
    try:
        # Contar tarefas pendentes
        if current_user.agent_id:
            tasks_pending = db.query(Task).filter(
                Task.assigned_agent_id == current_user.agent_id
            ).count()
    except Exception as e:
        print(f"[STATS] Error counting tasks: {e}")
    
    try:
        # Contar tarefas de hoje
        if current_user.agent_id:
            today = datetime.utcnow().date()
            tasks_today = db.query(Task).filter(
                and_(
                    Task.assigned_agent_id == current_user.agent_id,
                    func.date(Task.due_date) == today
                )
            ).count()
    except Exception as e:
        print(f"[STATS] Error counting today tasks: {e}")
    
    return {
        "properties": properties_count,
        "leads": leads_count,
        "tasks_pending": tasks_pending,
        "tasks_today": tasks_today,
        "agent_id": current_user.agent_id,
    }


@router.get("/dashboard/recent-activity")
def get_mobile_recent_activity(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atividade recente do agente
    Últimas propriedades, leads e tarefas
    """
    if not current_user.agent_id:
        return {"recent_properties": [], "recent_leads": [], "recent_tasks": []}
    
    # Últimas propriedades
    recent_properties = db.query(Property).filter(
        Property.agent_id == current_user.agent_id
    ).order_by(desc(Property.created_at)).limit(5).all()
    
    # Últimos leads
    recent_leads = db.query(Lead).filter(
        Lead.assigned_agent_id == current_user.agent_id
    ).order_by(desc(Lead.created_at)).limit(5).all()
    
    # Últimas tarefas
    recent_tasks = db.query(Task).filter(
        Task.assigned_agent_id == current_user.agent_id
    ).order_by(desc(Task.created_at)).limit(5).all()
    
    return {
        "recent_properties": [
            {
                "id": p.id,
                "reference": p.reference,
                "location": p.location,
                "price": p.price,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in recent_properties
        ],
        "recent_leads": [
            {
                "id": l.id,
                "name": l.name,
                "email": l.email,
                "phone": l.phone,
                "status": l.status,
                "created_at": l.created_at,
            }
            for l in recent_leads
        ],
        "recent_tasks": [
            {
                "id": t.id,
                "title": t.title,
                "due_date": t.due_date,
                "status": t.status,
                "priority": t.priority,
            }
            for t in recent_tasks
        ]
    }


# =====================================================
# VISITS - SISTEMA DE VISITAS
# =====================================================

@router.get("/visits", response_model=visit_schemas.VisitListResponse)
def list_mobile_visits(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    property_id: Optional[int] = None,
    lead_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar visitas do agente com filtros e paginação
    
    Query params:
    - page: Página atual (default: 1)
    - per_page: Items por página (default: 50, max: 100)
    - status: Filtrar por status (scheduled, confirmed, completed, etc)
    - date_from: Data inicial (ISO 8601)
    - date_to: Data final (ISO 8601)
    - property_id: Filtrar por propriedade
    - lead_id: Filtrar por lead
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Query base - apenas visitas do agente
    query = db.query(Visit).filter(Visit.agent_id == current_user.agent_id)
    
    # Aplicar filtros
    if status:
        query = query.filter(Visit.status == status)
    if date_from:
        query = query.filter(Visit.scheduled_date >= date_from)
    if date_to:
        query = query.filter(Visit.scheduled_date <= date_to)
    if property_id:
        query = query.filter(Visit.property_id == property_id)
    if lead_id:
        query = query.filter(Visit.lead_id == lead_id)
    
    # Total de resultados
    total = query.count()
    
    # Calcular paginação
    pages = math.ceil(total / per_page) if total > 0 else 1
    skip = (page - 1) * per_page
    
    # Ordenar por data agendada (mais próximas primeiro)
    query = query.order_by(Visit.scheduled_date.asc())
    
    # Aplicar paginação
    visits = query.offset(skip).limit(per_page).all()
    
    return visit_schemas.VisitListResponse(
        visits=visits,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/visits/today", response_model=visit_schemas.VisitTodayResponse)
def get_visits_today_mobile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Widget de visitas de hoje
    Otimizado para mostrar em dashboard mobile
    """
    if not current_user.agent_id:
        return visit_schemas.VisitTodayResponse(visits=[], count=0, next_visit=None)
    
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    visits = db.query(Visit).filter(
        and_(
            Visit.agent_id == current_user.agent_id,
            Visit.scheduled_date >= today_start,
            Visit.scheduled_date <= today_end,
            Visit.status.in_([
                VisitStatus.SCHEDULED.value,
                VisitStatus.CONFIRMED.value,
                VisitStatus.IN_PROGRESS.value
            ])
        )
    ).order_by(Visit.scheduled_date).all()
    
    # Encontrar próxima visita
    now = datetime.utcnow()
    next_visit_data = None
    
    for idx, visit in enumerate(visits):
        if visit.scheduled_date > now and not next_visit_data:
            # Calcular tempo até a visita
            time_diff = visit.scheduled_date - now
            countdown_minutes = int(time_diff.total_seconds() / 60)
            
            next_visit_data = {
                "id": visit.id,
                "time": visit.scheduled_date.strftime("%H:%M"),
                "countdown_minutes": countdown_minutes,
                "property_reference": visit.property.reference if visit.property else None
            }
    
    # Preparar widgets
    widgets = []
    for visit in visits:
        is_next = (next_visit_data and next_visit_data["id"] == visit.id)
        
        widgets.append(visit_schemas.VisitTodayWidget(
            id=visit.id,
            property_reference=visit.property.reference if visit.property else "N/A",
            property_location=visit.property.location if visit.property else None,
            lead_name=visit.lead.name if visit.lead else "Sem lead",
            scheduled_time=visit.scheduled_date.strftime("%H:%M"),
            status=visit.status,
            is_next=is_next
        ))
    
    return visit_schemas.VisitTodayResponse(
        visits=widgets,
        count=len(widgets),
        next_visit=next_visit_data
    )


@router.get("/visits/upcoming")
def get_upcoming_visits_mobile(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Widget "Próximas Visitas" para HomeScreen
    
    - Filtro automático por agent_id
    - Apenas visitas futuras (scheduled_date >= now)
    - Apenas status: SCHEDULED ou CONFIRMED
    - Ordenar por scheduled_date ASC (mais próxima primeiro)
    - Aceita query param 'limit' (default 5, max 20)
    - Retorna array simplificado
    """
    # Se user não tem agent_id, retornar array vazio
    if not current_user.agent_id:
        return []
    
    # Query com todos os filtros
    upcoming_visits = db.query(Visit).filter(
        Visit.agent_id == current_user.agent_id,
        Visit.scheduled_date >= datetime.utcnow(),
        Visit.status.in_([VisitStatus.SCHEDULED.value, VisitStatus.CONFIRMED.value])
    ).order_by(
        Visit.scheduled_date.asc()
    ).limit(limit).all()
    
    # Formatar response simplificado
    result = []
    for visit in upcoming_visits:
        property_obj = db.query(Property).filter(Property.id == visit.property_id).first()
        
        lead_name = None
        if visit.lead_id:
            lead_obj = db.query(Lead).filter(Lead.id == visit.lead_id).first()
            if lead_obj:
                lead_name = lead_obj.name
        
        result.append({
            "id": visit.id,
            "property_title": property_obj.title if property_obj else "Propriedade desconhecida",
            "scheduled_at": visit.scheduled_date.isoformat(),
            "lead_name": lead_name,
            "property_reference": property_obj.reference if property_obj else None,
            "status": visit.status
        })
    
    return result


@router.get("/visits/{visit_id}", response_model=visit_schemas.VisitOut)
def get_mobile_visit(
    visit_id: int,
    detail: bool = Query(True, description="Incluir dados de property/lead/agent"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de uma visita específica"""
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if visit.agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão para ver esta visita")
    
    return visit


@router.post("/visits", response_model=visit_schemas.VisitOut, status_code=201)
async def create_mobile_visit(
    visit: visit_schemas.VisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Agendar nova visita
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    try:
        # Verificar que a propriedade existe
        property_obj = db.query(Property).filter(Property.id == visit.property_id).first()
        if not property_obj:
            raise HTTPException(status_code=404, detail="Propriedade não encontrada")
        
        # Verificar que o lead existe (se fornecido)
        lead_obj = None
        if visit.lead_id:
            lead_obj = db.query(Lead).filter(Lead.id == visit.lead_id).first()
            if not lead_obj:
                raise HTTPException(status_code=404, detail="Lead não encontrado")
            
            # Atualizar status do lead
            if lead_obj.status != LeadStatus.CONVERTED.value:
                lead_obj.status = LeadStatus.VISIT_SCHEDULED.value
        
        # Criar visita
        new_visit = Visit(
            property_id=visit.property_id,
            lead_id=visit.lead_id,
            agent_id=current_user.agent_id,
            scheduled_date=visit.scheduled_date,
            duration_minutes=visit.duration_minutes,
            notes=visit.notes,
            status=VisitStatus.SCHEDULED.value
        )
        
        db.add(new_visit)
        
        # Criar task automática no calendário (opcional)
        try:
            task_title = f"Visita: {property_obj.reference}"
            if visit.lead_id and lead_obj:
                task_title += f" com {lead_obj.name}"
            
            new_task = Task(
                title=task_title,
                description=visit.notes or f"Visita agendada para {property_obj.location}",
                due_date=visit.scheduled_date,
                assigned_agent_id=current_user.agent_id,  # Corrigido: era agent_id
                property_id=visit.property_id,
                lead_id=visit.lead_id,
                status=TaskStatus.PENDING,
                priority=TaskPriority.HIGH
            )
            db.add(new_task)
        except Exception as e:
            print(f"Warning: Não foi possível criar task: {e}")
        
        db.commit()
        db.refresh(new_visit)
        
        # Tentar publicar evento (não bloquear se falhar)
        try:
            from app.core.events import event_bus
            await event_bus.publish(
                "visit_scheduled",
                {
                    "visit_id": new_visit.id,
                    "property_id": new_visit.property_id,
                    "scheduled_at": new_visit.scheduled_date.isoformat(),
                },
                agent_id=current_user.agent_id
            )
        except Exception as e:
            print(f"Warning: Não foi possível publicar evento: {e}")
        
        return new_visit
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar visita: {str(e)}"
        )


@router.put("/visits/{visit_id}", response_model=visit_schemas.VisitOut)
def update_mobile_visit(
    visit_id: int,
    visit_update: visit_schemas.VisitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reagendar ou editar visita
    Apenas visitas não concluídas podem ser editadas
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if visit.agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Não permitir editar visitas concluídas/canceladas
    if visit.status in [VisitStatus.COMPLETED.value, VisitStatus.CANCELLED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Visita com status '{visit.status}' não pode ser editada"
        )
    
    # Atualizar campos
    for field, value in visit_update.dict(exclude_unset=True).items():
        setattr(visit, field, value)
    
    visit.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(visit)
    
    return visit


@router.patch("/visits/{visit_id}/status")
def update_visit_status_mobile(
    visit_id: int,
    status_update: visit_schemas.VisitStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar status de visita rapidamente
    
    Transições válidas:
    - scheduled → confirmed
    - confirmed → in_progress (via check-in)
    - in_progress → completed (via check-out)
    - * → cancelled
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    # Verificar permissões
    if current_user.role == UserRole.AGENT.value:
        if visit.agent_id != current_user.agent_id:
            raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Validar transição de status
    current_status = visit.status
    new_status = status_update.status.value
    
    # Regras de transição
    valid_transitions = {
        VisitStatus.SCHEDULED.value: [VisitStatus.CONFIRMED.value, VisitStatus.CANCELLED.value, VisitStatus.NO_SHOW.value],
        VisitStatus.CONFIRMED.value: [VisitStatus.IN_PROGRESS.value, VisitStatus.CANCELLED.value, VisitStatus.NO_SHOW.value],
        VisitStatus.IN_PROGRESS.value: [VisitStatus.COMPLETED.value, VisitStatus.CANCELLED.value],
    }
    
    if current_status in valid_transitions:
        if new_status not in valid_transitions[current_status]:
            raise HTTPException(
                status_code=400,
                detail=f"Transição inválida de '{current_status}' para '{new_status}'"
            )
    
    visit.status = new_status
    if status_update.notes:
        visit.notes = (visit.notes or "") + f"\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {status_update.notes}"
    
    if new_status == VisitStatus.CANCELLED.value:
        visit.cancellation_reason = status_update.notes
    
    visit.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "status": visit.status, "visit_id": visit.id}


@router.post("/visits/{visit_id}/check-in", response_model=visit_schemas.CheckInResponse)
def visit_check_in_mobile(
    visit_id: int,
    checkin_data: visit_schemas.VisitCheckIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check-in em visita com validação de GPS
    
    Validações:
    - Visita deve estar scheduled ou confirmed
    - GPS deve estar próximo da propriedade (<500m)
    - Horário deve estar próximo do agendado (±30min)
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    # Verificar permissões
    if visit.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Verificar status
    if visit.status not in [VisitStatus.SCHEDULED.value, VisitStatus.CONFIRMED.value]:
        raise HTTPException(
            status_code=400,
            detail=f"Visita com status '{visit.status}' não pode fazer check-in"
        )
    
    # Validar horário (±30 minutos)
    now = datetime.utcnow()
    time_diff = abs((visit.scheduled_date - now).total_seconds() / 60)
    
    if time_diff > 30:
        # Aviso mas não bloqueia
        print(f"Warning: Check-in fora do horário agendado ({time_diff:.0f} minutos de diferença)")
    
    # Calcular distância da propriedade (se tiver coordenadas)
    distance_meters = None
    if visit.property and visit.property.latitude and visit.property.longitude:
        # Fórmula Haversine simplificada
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371000  # Raio da Terra em metros
        lat1 = radians(visit.property.latitude)
        lon1 = radians(visit.property.longitude)
        lat2 = radians(checkin_data.latitude)
        lon2 = radians(checkin_data.longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance_meters = R * c
        
        # Alerta se distância > 500m
        if distance_meters > 500:
            print(f"Warning: Check-in distante da propriedade ({distance_meters:.0f}m)")
    
    # Realizar check-in
    visit.checked_in_at = now
    visit.checkin_latitude = checkin_data.latitude
    visit.checkin_longitude = checkin_data.longitude
    visit.checkin_accuracy_meters = checkin_data.accuracy_meters
    visit.distance_from_property_meters = distance_meters
    visit.status = VisitStatus.IN_PROGRESS.value
    visit.updated_at = now
    
    db.commit()
    
    message = "Check-in realizado com sucesso"
    if distance_meters and distance_meters > 100:
        message += f" (distância: {distance_meters:.0f}m da propriedade)"
    
    return visit_schemas.CheckInResponse(
        success=True,
        checked_in_at=visit.checked_in_at,
        distance_from_property_meters=distance_meters,
        status=visit.status,
        message=message
    )


@router.post("/visits/{visit_id}/check-out", response_model=visit_schemas.CheckOutResponse)
def visit_check_out_mobile(
    visit_id: int,
    checkout_data: visit_schemas.VisitCheckOut,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check-out de visita com feedback
    
    Side effects:
    - Marca visita como completed
    - Pode atualizar status do lead baseado no feedback
    - Marca task relacionada como completa
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    # Verificar permissões
    if visit.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Verificar status
    if visit.status != VisitStatus.IN_PROGRESS.value:
        raise HTTPException(
            status_code=400,
            detail=f"Visita deve estar em progresso para fazer check-out (status atual: {visit.status})"
        )
    
    if not visit.checked_in_at:
        raise HTTPException(status_code=400, detail="Visita não tem check-in")
    
    # Realizar check-out
    now = datetime.utcnow()
    visit.checked_out_at = now
    visit.rating = checkout_data.rating
    visit.interest_level = checkout_data.interest_level.value if checkout_data.interest_level else None
    visit.feedback_notes = checkout_data.feedback_notes
    visit.will_return = checkout_data.will_return
    visit.next_steps = checkout_data.next_steps
    visit.status = VisitStatus.COMPLETED.value
    visit.updated_at = now
    
    # Atualizar lead baseado no feedback
    if visit.lead and checkout_data.interest_level:
        lead = visit.lead
        
        # Se interesse alto/muito alto, marcar como qualified
        if checkout_data.interest_level in [InterestLevel.HIGH, InterestLevel.VERY_HIGH]:
            if lead.status not in [LeadStatus.CONVERTED.value, LeadStatus.NEGOTIATION.value]:
                lead.status = LeadStatus.QUALIFIED.value
        
        # Adicionar nota ao lead
        if checkout_data.feedback_notes:
            timestamp = now.strftime("%Y-%m-%d %H:%M")
            note_text = f"[{timestamp}] VISITA: {checkout_data.feedback_notes}"
            # lead.notes = (lead.notes or "") + "\n" + note_text  # Se campo notes existir
    
    # Marcar task relacionada como completa (se existir)
    if visit.lead_id and visit.property_id:
        task = db.query(Task).filter(
            and_(
                Task.lead_id == visit.lead_id,
                Task.property_id == visit.property_id,
                Task.assigned_agent_id == visit.agent_id,
                Task.status != TaskStatus.COMPLETED.value
            )
        ).first()
        
        if task:
            task.status = TaskStatus.COMPLETED.value
            task.completed_at = now
    
    db.commit()
    
    duration = visit.duration_actual_minutes
    
    return visit_schemas.CheckOutResponse(
        success=True,
        checked_out_at=visit.checked_out_at,
        duration_minutes=duration,
        status=visit.status,
        message=f"Check-out realizado! Duração: {duration}min" if duration else "Check-out realizado"
    )


@router.post("/visits/{visit_id}/feedback")
def add_visit_feedback_mobile(
    visit_id: int,
    feedback: visit_schemas.VisitFeedback,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adicionar feedback a visita (alternativa ao check-out)
    Útil para adicionar feedback posteriormente
    """
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    
    # Verificar permissões
    if visit.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Atualizar feedback
    if feedback.rating:
        visit.rating = feedback.rating
    if feedback.interest_level:
        visit.interest_level = feedback.interest_level.value
    if feedback.feedback_notes:
        visit.feedback_notes = feedback.feedback_notes
    if feedback.will_return is not None:
        visit.will_return = feedback.will_return
    
    visit.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "success": True,
        "message": "Feedback adicionado",
        "visit_id": visit.id
    }


# =====================================================
# LEADS - CRIAR (BLOQUEADOR CRÍTICO)
# =====================================================

@router.post("/leads", response_model=lead_schemas.LeadOut, status_code=201)
async def create_lead_mobile(
    lead_data: lead_schemas.LeadCreateMobile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar lead em campo (BLOQUEADOR CRÍTICO - Frontend precisa)
    
    - Auto-atribui lead ao agent_id do token JWT
    - Status inicial: NEW
    - Validação: user precisa ter agent_id (ser agente, não admin puro)
    - Campos obrigatórios: name
    - Campos opcionais: email, phone, origin, budget, notes
    - FASE 2: Envia notificação WebSocket ao agente
    """
    # Validar se user tem agent_id (é agente, não apenas admin)
    if not current_user.agent_id:
        raise HTTPException(
            status_code=403,
            detail="Apenas agentes podem criar leads via mobile app"
        )
    
    try:
        # Criar lead com auto-atribuição
        new_lead = Lead(
            name=lead_data.name,
            email=lead_data.email,  # Pode ser None
            phone=lead_data.phone,
            source=lead_data.source or LeadSource.MANUAL,
            origin=lead_data.origin or lead_data.notes,  # Guardar notes em origin se não tiver origin
            assigned_agent_id=current_user.agent_id,  # ← Auto-atribuição
            status=LeadStatus.NEW  # ← Status inicial sempre NEW
        )
        
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)
        
        # Tentar publicar evento (não bloquear se falhar)
        try:
            from app.core.events import event_bus
            await event_bus.publish(
                "new_lead",
                {
                    "lead_id": new_lead.id,
                    "name": new_lead.name,
                    "email": new_lead.email,
                    "phone": new_lead.phone,
                    "source": str(new_lead.source) if new_lead.source else "Mobile App",
                },
                agent_id=current_user.agent_id
            )
        except Exception as e:
            print(f"Warning: Não foi possível publicar evento: {e}")
        
        return new_lead
    except Exception as e:
        db.rollback()
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar lead: {str(e)}"
        )


# =====================================================
# CALENDAR - ENDPOINTS PARA AGENDA
# =====================================================

@router.get("/calendar/day/{date}")
def get_calendar_day_visits(
    date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter todas as visitas de um dia específico para AgendaScreen
    
    Args:
        date: Data no formato YYYY-MM-DD
    
    Returns:
        Lista de visitas com cliente, imóvel e status
    """
    # Validar formato de data
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Formato de data inválido. Use YYYY-MM-DD"
        )
    
    # Validar se user é agente
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Apenas agentes podem acessar agenda")
    
    # Obter visitas do dia
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = datetime.combine(target_date, datetime.max.time())
    
    visits = db.query(Visit).filter(
        Visit.agent_id == current_user.agent_id,
        Visit.scheduled_date >= day_start,
        Visit.scheduled_date <= day_end
    ).order_by(Visit.scheduled_date.asc()).all()
    
    result = []
    for visit in visits:
        # Obter lead e property relacionados
        lead = db.query(Lead).filter(Lead.id == visit.lead_id).first()
        prop = db.query(Property).filter(Property.id == visit.property_id).first()
        
        result.append({
            "id": visit.id,
            "time": visit.scheduled_date.strftime("%H:%M"),
            "client": lead.name if lead else "Cliente não encontrado",
            "property": prop.title if prop else "Imóvel não encontrado",
            "location": f"{prop.city}, {prop.district}" if prop and prop.city else "Localização não definida",
            "status": visit.status.value if hasattr(visit.status, 'value') else visit.status or "scheduled"
        })
    
    return result


@router.get("/calendar/month/{year}/{month}")
def get_calendar_month_marks(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter dias com visitas para marcar no calendário
    
    Args:
        year: Ano (ex: 2024)
        month: Mês (1-12)
    
    Returns:
        Objeto com datas marcadas no formato react-native-calendars
        {
            "2024-12-20": {"marked": true, "dotColor": "#00d9ff", "count": 2},
            "2024-12-21": {"marked": true, "dotColor": "#00d9ff", "count": 1}
        }
    """
    # Validar mês
    if not (1 <= month <= 12):
        raise HTTPException(
            status_code=400,
            detail="Mês inválido. Deve estar entre 1 e 12"
        )
    
    # Validar se user é agente
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Apenas agentes podem acessar agenda")
    
    # Obter primeiro e último dia do mês
    first_day = datetime(year, month, 1)
    if month == 12:
        last_day = datetime(year + 1, 1, 1)
    else:
        last_day = datetime(year, month + 1, 1)
    
    # Obter todas as visitas do mês
    visits = db.query(Visit).filter(
        Visit.agent_id == current_user.agent_id,
        Visit.scheduled_date >= first_day,
        Visit.scheduled_date < last_day
    ).all()
    
    # Agrupar por data
    marked_dates = {}
    for visit in visits:
        date_str = visit.scheduled_date.strftime("%Y-%m-%d")
        if date_str not in marked_dates:
            marked_dates[date_str] = {
                "marked": True,
                "dotColor": "#00d9ff",
                "count": 1
            }
        else:
            marked_dates[date_str]["count"] += 1
    
    return marked_dates


# =====================================================
# USER PREFERENCES - Configurações Mobile App
# =====================================================

from pydantic import BaseModel

class SitePreferencesUpdate(BaseModel):
    """Schema para atualizar preferências (aceita parcial)"""
    theme: Optional[str] = None
    language: Optional[str] = None
    notifications: Optional[dict] = None
    bio: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    whatsapp: Optional[str] = None

class SitePreferencesOut(BaseModel):
    """Schema de resposta de preferências"""
    theme: str
    language: str
    notifications: dict
    bio: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None
    whatsapp: Optional[str] = None


@router.get("/site-preferences", response_model=SitePreferencesOut)
def get_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter preferências do utilizador para mobile app
    Carrega bio e redes sociais da tabela agent_site_preferences
    """
    # Verificar se utilizador tem agente associado
    agent_id = current_user.agent_id
    
    # Carregar preferências da BD
    prefs = None
    if agent_id:
        prefs = db.query(AgentSitePreferences).filter(
            AgentSitePreferences.agent_id == agent_id
        ).first()
    
    if prefs:
        return SitePreferencesOut(
            theme=prefs.theme or "dark",
            language="pt",
            notifications={
                "new_leads": True,
                "visits_reminder": True,
                "property_updates": True,
                "push_enabled": False
            },
            bio=prefs.bio,
            instagram=prefs.instagram,
            facebook=prefs.facebook,
            linkedin=prefs.linkedin,
            twitter=prefs.twitter,
            tiktok=prefs.tiktok,
            whatsapp=prefs.whatsapp
        )
    
    # Retornar defaults se não existir
    return SitePreferencesOut(
        theme="dark",
        language="pt",
        notifications={
            "new_leads": True,
            "visits_reminder": True,
            "property_updates": True,
            "push_enabled": False
        },
        bio=None,
        instagram=None,
        facebook=None,
        linkedin=None,
        twitter=None,
        tiktok=None,
        whatsapp=None
    )


@router.put("/site-preferences", response_model=SitePreferencesOut)
def update_user_preferences(
    preferences: SitePreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar preferências do utilizador
    PERSISTE bio, redes sociais e tema na tabela agent_site_preferences
    """
    # Verificar se utilizador tem agente associado
    agent_id = current_user.agent_id
    if not agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Buscar ou criar preferências
    prefs = db.query(AgentSitePreferences).filter(
        AgentSitePreferences.agent_id == agent_id
    ).first()
    
    if not prefs:
        # Criar novo registo
        prefs = AgentSitePreferences(agent_id=agent_id)
        db.add(prefs)
    
    # Atualizar campos se fornecidos
    if preferences.theme is not None:
        prefs.theme = preferences.theme
    if preferences.bio is not None:
        prefs.bio = preferences.bio
    if preferences.instagram is not None:
        prefs.instagram = preferences.instagram
    if preferences.facebook is not None:
        prefs.facebook = preferences.facebook
    if preferences.linkedin is not None:
        prefs.linkedin = preferences.linkedin
    if preferences.twitter is not None:
        prefs.twitter = preferences.twitter
    if preferences.tiktok is not None:
        prefs.tiktok = preferences.tiktok
    if preferences.whatsapp is not None:
        prefs.whatsapp = preferences.whatsapp
    
    # Guardar na BD
    db.commit()
    db.refresh(prefs)
    
    logger.info(f"Site preferences updated for agent_id={agent_id}")
    
    return SitePreferencesOut(
        theme=prefs.theme or "dark",
        language="pt",
        notifications={
            "new_leads": True,
            "visits_reminder": True,
            "property_updates": True,
            "push_enabled": False
        },
        bio=prefs.bio,
        instagram=prefs.instagram,
        facebook=prefs.facebook,
        linkedin=prefs.linkedin,
        twitter=prefs.twitter,
        tiktok=prefs.tiktok,
        whatsapp=prefs.whatsapp
    )


# =====================================================
# EVENTS - Agenda Universal
# =====================================================

@router.post("/events", response_model=event_schemas.EventOut, status_code=201)
async def create_mobile_event(
    event: event_schemas.EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar evento genérico na agenda
    
    Tipos suportados:
    - visit: Visita a imóvel (requer property_id)
    - meeting: Reunião (cliente, equipa, online)
    - task: Tarefa (preparar docs, follow-up)
    - personal: Pessoal (almoço, dentista)
    - call: Chamada telefónica
    - other: Outro
    
    Campos obrigatórios: title, event_type, scheduled_date
    Campos opcionais: property_id, lead_id, location, notes, duration_minutes
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Validar property se for visita
    if event.event_type == event_schemas.EventType.VISIT:
        if not event.property_id:
            raise HTTPException(status_code=400, detail="Visitas requerem property_id")
        
        property_obj = db.query(Property).filter(Property.id == event.property_id).first()
        if not property_obj:
            raise HTTPException(status_code=404, detail="Propriedade não encontrada")
    
    # Validar lead se fornecido
    if event.lead_id:
        lead_obj = db.query(Lead).filter(Lead.id == event.lead_id).first()
        if not lead_obj:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
    
    # Criar evento
    event_data = event.dict()
    event_data['agent_id'] = current_user.agent_id
    event_data['status'] = event_schemas.EventStatus.SCHEDULED.value
    
    new_event = Event(**event_data)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Log
    logger.info(f"✅ Evento criado: #{new_event.id} ({new_event.event_type}) por agente {current_user.agent_id}")
    
    return new_event


@router.get("/events", response_model=List[event_schemas.EventOut])
def list_mobile_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar eventos do agente
    
    Filtros (todos opcionais):
    - start_date: Data início (default: início do mês atual)
    - end_date: Data fim (default: fim do mês atual)
    - event_type: Filtrar por tipo (visit, meeting, task, personal, call, other)
    - status: Filtrar por status (scheduled, completed, cancelled, no_show)
    
    Retorna eventos ordenados por data (mais próximos primeiro)
    """
    if not current_user.agent_id:
        return []
    
    query = db.query(Event).filter(Event.agent_id == current_user.agent_id)
    
    # Filtro de datas (default: mês atual)
    if not start_date:
        now = datetime.now(timezone.utc)
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    if not end_date:
        # Último dia do mês
        last_day = cal_module.monthrange(start_date.year, start_date.month)[1]
        end_date = start_date.replace(day=last_day, hour=23, minute=59, second=59)
    
    query = query.filter(Event.scheduled_date.between(start_date, end_date))
    
    # Filtro por tipo
    if event_type:
        query = query.filter(Event.event_type == event_type)
    
    # Filtro por status
    if status:
        query = query.filter(Event.status == status)
    
    # Ordenar por data
    query = query.order_by(Event.scheduled_date)
    
    return query.all()


@router.get("/events/today", response_model=List[event_schemas.EventOut])
def get_today_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter eventos de hoje (atalho útil para dashboard)"""
    if not current_user.agent_id:
        return []
    
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    events = db.query(Event).filter(
        Event.agent_id == current_user.agent_id,
        Event.scheduled_date.between(start_of_day, end_of_day),
        Event.status == 'scheduled'
    ).order_by(Event.scheduled_date).all()
    
    return events


@router.get("/events/{event_id}", response_model=event_schemas.EventOut)
def get_mobile_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de um evento"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Verificar permissões
    if event.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Sem permissão para aceder a este evento")
    
    return event


@router.put("/events/{event_id}", response_model=event_schemas.EventOut)
def update_mobile_event(
    event_id: int,
    event_update: event_schemas.EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar evento"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    if event.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    # Atualizar campos fornecidos
    for field, value in event_update.dict(exclude_unset=True).items():
        setattr(event, field, value)
    
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    
    return event


@router.delete("/events/{event_id}", status_code=204)
def delete_mobile_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletar evento"""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    if event.agent_id != current_user.agent_id:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    db.delete(event)
    db.commit()
    
    return None


# =====================================================
# SITE PREFERENCES - Personalização Site Montra
# TODO: Reativar após aplicar migração da tabela agent_site_preferences
# =====================================================

# TEMPORARIAMENTE DESATIVADO - A tabela agent_site_preferences não existe em produção
# Para reativar:
# 1. Aplicar migração: alembic upgrade head (ou usar /debug/run-migration)
# 2. Descomentar o código abaixo
# 
# from app.models.agent_site_preferences import AgentSitePreferences
# from app.schemas.site_preferences import (
#     SitePreferencesOut, 
#     SitePreferencesUpdate, 
#     SitePreferencesResponse,
#     AgentSitePublic,
#     AgentPublicInfo,
#     PropertyPublicInfo
# )
# 
# Os endpoints /site-preferences e /public/agent/{id}/site estão desativados
# até a migração ser aplicada na base de dados de produção.
