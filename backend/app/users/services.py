from sqlalchemy.orm import Session
from . import models, schemas
import bcrypt
from typing import Optional


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    password_bytes = password.encode('utf-8')[:72]  # bcrypt has 72-byte limit
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email.lower()).first()


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    role: Optional[str] = None,
    is_active: Optional[bool] = None
) -> list[models.User]:
    query = db.query(models.User)
    
    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = hash_password(user.password)
    db_user = models.User(
        email=user.email.lower(),
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role.value,
        phone=user.phone,
        avatar_url=user.avatar_url,
        agent_id=user.agent_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate) -> Optional[models.User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "email" in update_data:
        update_data["email"] = update_data["email"].lower()
    if "role" in update_data:
        update_data["role"] = update_data["role"].value
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_password(
    db: Session, 
    user_id: int, 
    current_password: str, 
    new_password: str
) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    if not verify_password(current_password, db_user.hashed_password):
        return False
    
    db_user.hashed_password = hash_password(new_password)
    db.commit()
    return True


def delete_user(db: Session, user_id: int) -> Optional[models.User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db.delete(db_user)
    db.commit()
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """Autenticar utilizador por email e password"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user
