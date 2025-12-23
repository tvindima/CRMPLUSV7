from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from . import services, schemas
from app.database import get_db
from app.security import require_staff, get_current_user
from .models import User, UserRole

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[schemas.UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Listar utilizadores (requer staff)"""
    return services.get_users(db, skip=skip, limit=limit, role=role, is_active=is_active)


@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Obter perfil do utilizador autenticado"""
    return current_user


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Obter utilizador por ID (requer staff)"""
    user = services.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserOut, status_code=201)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Criar novo utilizador (requer staff)

    - Admins podem criar qualquer role
    - Agentes podem criar apenas assistentes associados ao seu agent_id
    """
    # Validar role se current_user não for admin
    if current_user.role != UserRole.ADMIN.value:
        if user.role != UserRole.ASSISTANT:
            raise HTTPException(status_code=403, detail="Apenas admins podem criar este tipo de utilizador")
        # Forçar association ao agent_id do criador
        if not current_user.agent_id:
            raise HTTPException(status_code=400, detail="Utilizador não tem agent_id para associar assistente")
        user.agent_id = current_user.agent_id
    # Verificar email existente
    existing = services.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return services.create_user(db, user)


@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Atualizar utilizador (requer staff)"""
    user = services.update_user(db, user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me/profile", response_model=schemas.UserOut)
def update_own_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar próprio perfil (qualquer utilizador autenticado)"""
    # Não permitir alterar role ou is_active no próprio perfil
    user_update.role = None
    user_update.is_active = None
    
    user = services.update_user(db, current_user.id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/me/password")
def update_own_password(
    password_update: schemas.UserUpdatePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar própria password"""
    success = services.update_user_password(
        db,
        current_user.id,
        password_update.current_password,
        password_update.new_password
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    return {"message": "Password updated successfully"}


@router.delete("/{user_id}", response_model=schemas.UserOut)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Deletar utilizador (requer staff)"""
    user = services.delete_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
