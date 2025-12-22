from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from . import services, schemas
from .models import TaskStatus, TaskType, TaskPriority
from app.database import get_db

router = APIRouter(prefix="/calendar", tags=["calendar"])

# ==================== TASK ROUTES ====================

@router.get("/tasks", response_model=list[schemas.TaskOut])
def list_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[TaskStatus] = None,
    task_type: Optional[TaskType] = None,
    priority: Optional[TaskPriority] = None,
    assigned_agent_id: Optional[int] = None,
    lead_id: Optional[int] = None,
    property_id: Optional[int] = None,
    due_date_start: Optional[datetime] = None,
    due_date_end: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """
    Lista tarefas com filtros avançados.
    
    Filtros disponíveis:
    - status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE
    - task_type: VISIT, CALL, MEETING, FOLLOWUP, OTHER
    - priority: LOW, MEDIUM, HIGH, URGENT
    - assigned_agent_id: ID do agente responsável
    - lead_id: ID da lead associada
    - property_id: ID da propriedade associada
    - due_date_start: Data inicial (ISO 8601)
    - due_date_end: Data final (ISO 8601)
    """
    return services.get_tasks(
        db,
        skip=skip,
        limit=limit,
        status=status,
        task_type=task_type,
        priority=priority,
        assigned_agent_id=assigned_agent_id,
        lead_id=lead_id,
        property_id=property_id,
        due_date_start=due_date_start,
        due_date_end=due_date_end
    )


@router.get("/tasks/today", response_model=list[schemas.TaskOut])
def list_tasks_today(
    assigned_agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retorna tarefas do dia (hoje)"""
    return services.get_tasks_today(db, assigned_agent_id=assigned_agent_id)


@router.get("/tasks/week", response_model=list[schemas.TaskOut])
def list_tasks_week(
    assigned_agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retorna tarefas da semana (próximos 7 dias)"""
    return services.get_tasks_week(db, assigned_agent_id=assigned_agent_id)


@router.get("/tasks/overdue", response_model=list[schemas.TaskOut])
def list_overdue_tasks(
    assigned_agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retorna tarefas atrasadas"""
    return services.get_overdue_tasks(db, assigned_agent_id=assigned_agent_id)


@router.get("/tasks/stats", response_model=schemas.TaskStats)
def get_tasks_stats(
    assigned_agent_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas de tarefas.
    Se assigned_agent_id for fornecido, retorna stats apenas do agente.
    """
    return services.get_task_stats(db, assigned_agent_id=assigned_agent_id)


@router.get("/tasks/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Retorna detalhes de uma tarefa específica"""
    task = services.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(
    task: schemas.TaskCreate,
    created_by_id: Optional[int] = Query(None, description="ID do agente que criou a tarefa"),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova tarefa.
    
    Campos obrigatórios:
    - title: Título da tarefa
    - task_type: Tipo (VISIT, CALL, MEETING, FOLLOWUP, OTHER)
    - due_date: Data/hora de vencimento
    - assigned_agent_id: Agente responsável
    
    Campos opcionais:
    - description: Descrição detalhada
    - priority: Prioridade (LOW, MEDIUM, HIGH, URGENT) - default: MEDIUM
    - lead_id: Lead associada
    - property_id: Propriedade associada
    """
    return services.create_task(db, task, created_by_id=created_by_id)


@router.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma tarefa existente"""
    task = services.update_task(db, task_id, task_update)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/{task_id}/complete", response_model=schemas.TaskOut)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    """
    Marca tarefa como concluída.
    Seta status=COMPLETED e completed_at=now.
    """
    task = services.complete_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks/{task_id}/cancel", response_model=schemas.TaskOut)
def cancel_task(task_id: int, db: Session = Depends(get_db)):
    """Cancela uma tarefa (status=CANCELLED)"""
    task = services.cancel_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/tasks/{task_id}", response_model=schemas.TaskOut)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Remove uma tarefa permanentemente"""
    task = services.delete_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ==================== CALENDAR EVENT ROUTES (legacy) ====================

@router.get("/", response_model=list[schemas.CalendarEventOut])
def list_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return services.get_events(db, skip=skip, limit=limit)


@router.get("/{event_id}", response_model=schemas.CalendarEventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = services.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/", response_model=schemas.CalendarEventOut, status_code=201)
def create_event(event: schemas.CalendarEventCreate, db: Session = Depends(get_db)):
    return services.create_event(db, event)


@router.put("/{event_id}", response_model=schemas.CalendarEventOut)
def update_event(event_id: int, event_update: schemas.CalendarEventUpdate, db: Session = Depends(get_db)):
    event = services.update_event(db, event_id, event_update)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.delete("/{event_id}", response_model=schemas.CalendarEventOut)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = services.delete_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
