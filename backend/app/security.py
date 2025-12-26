import os
from typing import Optional
from datetime import datetime, timedelta

import jwt
from fastapi import HTTPException, Request, status, Depends
from sqlalchemy.orm import Session

SECRET_KEY = os.environ.get("CRMPLUS_AUTH_SECRET", "change_me_crmplus_secret")
ALGORITHM = "HS256"
STAFF_COOKIE = "crmplus_staff_session"
ALLOWED_ROLES = {"staff", "admin", "coordinator", "agent"}

# Mobile app tokens duration
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas (era 60)
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(user_id: int, email: str, role: str, agent_id: Optional[int] = None) -> str:
    """
    Cria JWT access token para mobile app
    Inclui agent_id no payload (requerido por frontend)
    """
    payload = {
        "sub": email,
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    
    # Incluir agent_id se existir (crítico para mobile app)
    if agent_id:
        payload["agent_id"] = agent_id
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirou")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")


def extract_token(req: Request) -> Optional[str]:
    auth = req.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    cookie_token = req.cookies.get(STAFF_COOKIE)
    if cookie_token:
        return cookie_token
    return None


def get_current_user(req: Request, db: Session = Depends(lambda: None)):
    """Dependency para obter utilizador autenticado atual"""
    from app.database import get_db
    from app.users.models import User
    
    if db is None:
        db = next(get_db())
    
    token = extract_token(req)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais em falta")
    
    try:
        payload = decode_token(token)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido: {str(e)}")
    
    user_id = payload.get("user_id")
    
    if not user_id:
        # Fallback para sistema antigo (email)
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido - sem user_id nem email")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Se o user não existe, criar automaticamente (migração)
            print(f"[WARN] Criando user automático para {email}")
            user = User(
                email=email,
                name=email.split('@')[0],
                password_hash="legacy_hash",
                role="admin",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    else:
        user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilizador não encontrado")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Utilizador inativo")
    
    return user


def require_staff(req: Request, db: Session = Depends(lambda: None)):
    """Requer qualquer utilizador autenticado (staff, admin, coordinator, agent)"""
    user = get_current_user(req, db)
    return user


def require_admin(req: Request, db: Session = Depends(lambda: None)):
    """Requer utilizador com role admin"""
    user = get_current_user(req, db)
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente - Admin necessário")
    return user


def get_effective_agent_id(req: Request, db: Session = Depends(lambda: None)) -> Optional[int]:
    """
    Obtém o agent_id efetivo do token JWT.
    Para assistentes, retorna o works_for_agent_id (que está no token como agent_id).
    Para agentes normais, retorna o próprio agent_id.
    """
    token = extract_token(req)
    if not token:
        return None
    
    try:
        payload = decode_token(token)
        return payload.get("agent_id")
    except:
        return None
