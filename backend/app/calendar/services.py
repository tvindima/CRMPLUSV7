from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
from typing import Optional, List
from .models import Task, TaskStatus, TaskType, TaskPriority, CalendarEvent
from .schemas import TaskCreate, TaskUpdate, TaskComplete, TaskStats, CalendarEventCreate, CalendarEventUpdate


# ==================== TASK SERVICES ====================

def get_tasks(
    db: Session,
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
    include_overdue: bool = True
):
    """
    Lista tarefas com filtros avançados.
    Retorna tarefas com relacionamentos carregados.
    """
    # Não carregar relacionamentos para evitar erros de serialização
    query = db.query(Task)
    
    # Filtros
    if status:
        query = query.filter(Task.status == status)
    if task_type:
        query = query.filter(Task.task_type == task_type)
    if priority:
        query = query.filter(Task.priority == priority)
    if assigned_agent_id:
        query = query.filter(Task.assigned_agent_id == assigned_agent_id)
    if lead_id:
        query = query.filter(Task.lead_id == lead_id)
    if property_id:
        query = query.filter(Task.property_id == property_id)
    if due_date_start:
        query = query.filter(Task.due_date >= due_date_start)
    if due_date_end:
        query = query.filter(Task.due_date <= due_date_end)
    
    # Incluir tarefas atrasadas se solicitado
    if include_overdue:
        now = datetime.utcnow()
        overdue_tasks = db.query(Task).filter(
            and_(
                Task.due_date < now,
                Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
            )
        ).all()
        # Atualizar status para OVERDUE
        for task in overdue_tasks:
            task.status = TaskStatus.OVERDUE
        db.commit()
    
    return query.order_by(Task.due_date.asc()).offset(skip).limit(limit).all()


def get_tasks_today(db: Session, assigned_agent_id: Optional[int] = None):
    """Retorna tarefas do dia"""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    return get_tasks(
        db,
        assigned_agent_id=assigned_agent_id,
        due_date_start=today_start,
        due_date_end=today_end,
        limit=1000
    )


def get_tasks_week(db: Session, assigned_agent_id: Optional[int] = None):
    """Retorna tarefas da semana"""
    week_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)
    
    return get_tasks(
        db,
        assigned_agent_id=assigned_agent_id,
        due_date_start=week_start,
        due_date_end=week_end,
        limit=1000
    )


def get_overdue_tasks(db: Session, assigned_agent_id: Optional[int] = None):
    """Retorna tarefas atrasadas"""
    query = db.query(Task).filter(
        and_(
            Task.due_date < datetime.utcnow(),
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS])
        )
    )
    
    if assigned_agent_id:
        query = query.filter(Task.assigned_agent_id == assigned_agent_id)
    
    return query.order_by(Task.due_date.asc()).all()


def get_task(db: Session, task_id: int):
    """Retorna uma tarefa específica sem relacionamentos para evitar problemas de serialização"""
    return db.query(Task).filter(Task.id == task_id).first()


def create_task(db: Session, task: TaskCreate, created_by_id: Optional[int] = None):
    """
    Cria uma nova tarefa.
    Auto-detecta se está atrasada e seta reminder_sent=False.
    """
    task_data = task.model_dump()
    task_data['created_by_id'] = created_by_id
    task_data['status'] = TaskStatus.PENDING
    task_data['reminder_sent'] = False
    
    # Verificar se já está atrasada
    if task_data['due_date'] < datetime.utcnow():
        task_data['status'] = TaskStatus.OVERDUE
    
    db_task = Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    return get_task(db, db_task.id)


def update_task(db: Session, task_id: int, task_update: TaskUpdate):
    """Atualiza uma tarefa existente"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    # Verificar se ficou atrasada
    if db_task.due_date < datetime.utcnow() and db_task.status in [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]:
        db_task.status = TaskStatus.OVERDUE
    
    db.commit()
    db.refresh(db_task)
    return get_task(db, task_id)


def complete_task(db: Session, task_id: int):
    """Marca tarefa como concluída"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    db_task.status = TaskStatus.COMPLETED
    db_task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_task)
    return get_task(db, task_id)


def cancel_task(db: Session, task_id: int):
    """Cancela uma tarefa"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    db_task.status = TaskStatus.CANCELLED
    db.commit()
    db.refresh(db_task)
    return get_task(db, task_id)


def delete_task(db: Session, task_id: int):
    """Remove uma tarefa permanentemente"""
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
    return db_task


def get_task_stats(db: Session, assigned_agent_id: Optional[int] = None):
    """
    Retorna estatísticas de tarefas.
    Pode filtrar por agente específico.
    """
    query = db.query(Task)
    if assigned_agent_id:
        query = query.filter(Task.assigned_agent_id == assigned_agent_id)
    
    all_tasks = query.all()
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)
    
    stats = TaskStats(
        total=len(all_tasks),
        pending=len([t for t in all_tasks if t.status == TaskStatus.PENDING]),
        in_progress=len([t for t in all_tasks if t.status == TaskStatus.IN_PROGRESS]),
        completed=len([t for t in all_tasks if t.status == TaskStatus.COMPLETED]),
        overdue=len([t for t in all_tasks if t.status == TaskStatus.OVERDUE]),
        today=len([t for t in all_tasks if today_start <= t.due_date < today_end]),
        this_week=len([t for t in all_tasks if today_start <= t.due_date < week_end])
    )
    
    return stats


def get_tasks_for_reminders(db: Session, hours_before: int = 1):
    """
    Retorna tarefas que precisam de lembrete.
    Por padrão, tarefas que vencem em 1 hora e ainda não receberam lembrete.
    """
    now = datetime.utcnow()
    reminder_time = now + timedelta(hours=hours_before)
    
    tasks = db.query(Task).filter(
        and_(
            Task.due_date <= reminder_time,
            Task.due_date > now,
            Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            Task.reminder_sent == False
        )
    ).all()
    
    return tasks


def mark_reminder_sent(db: Session, task_id: int):
    """Marca que lembrete foi enviado para uma tarefa"""
    db_task = get_task(db, task_id)
    if db_task:
        db_task.reminder_sent = True
        db.commit()
        db.refresh(db_task)
    return db_task


# ==================== CALENDAR EVENT SERVICES (legacy) ====================

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(CalendarEvent).offset(skip).limit(limit).all()


def get_event(db: Session, event_id: int):
    return db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()


def create_event(db: Session, event: CalendarEventCreate):
    db_event = CalendarEvent(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def update_event(db: Session, event_id: int, event_update: CalendarEventUpdate):
    db_event = get_event(db, event_id)
    if not db_event:
        return None
    for key, value in event_update.model_dump(exclude_unset=True).items():
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event


def delete_event(db: Session, event_id: int):
    db_event = get_event(db, event_id)
    if db_event:
        db.delete(db_event)
        db.commit()
    return db_event
