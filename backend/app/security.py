import os
import logging
from typing import Optional
from datetime import datetime, timedelta

import jwt
from fastapi import HTTPException, Request, status, Depends
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# SECURITY: SECRET_KEY deve estar sempre definido em produção
SECRET_KEY = os.environ.get("CRMPLUS_AUTH_SECRET")
if not SECRET_KEY:
    # Em desenvolvimento, usar fallback (mas nunca em produção)
    if os.environ.get("RAILWAY_ENVIRONMENT"):
        # Tentar fallback para SECRET_KEY se CRMPLUS_AUTH_SECRET não estiver definido
        SECRET_KEY = os.environ.get("SECRET_KEY")
        if SECRET_KEY:
            logger.warning("⚠️  Using SECRET_KEY as fallback - please set CRMPLUS_AUTH_SECRET")
        else:
            logger.critical("🚨 CRITICAL: Neither CRMPLUS_AUTH_SECRET nor SECRET_KEY is set in production!")
            # Usar um valor único baseado em outras variáveis de ambiente (temporário)
            SECRET_KEY = os.environ.get("DATABASE_URL", "emergency_fallback_change_me")[:64]
            logger.warning("⚠️  Using emergency fallback SECRET_KEY - set CRMPLUS_AUTH_SECRET immediately!")
    else:
        SECRET_KEY = "dev_only_secret_change_in_production"
        print("⚠️  WARNING: Using development SECRET_KEY - DO NOT use in production!")

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
    
    try:
        if db is None:
            db = next(get_db())
    except Exception as e:
        print(f"[GET_CURRENT_USER] DB connection error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erro de conexão à BD")
    
    token = extract_token(req)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais em falta")
    
    try:
        payload = decode_token(token)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido: {str(e)}")
    
    try:
        user_id = payload.get("user_id")
        
        if not user_id:
            # Fallback para sistema antigo (email)
            email = payload.get("email")
            if not email:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido - sem user_id nem email")
            user = db.query(User).filter(User.email == email).first()
            # SECURITY: Removida criação automática de users - era falha de segurança crítica
            if not user:
                print(f"[SECURITY] Tentativa de acesso com email não registado: {email}")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilizador não encontrado - contacte o administrador")
        else:
            user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilizador não encontrado")
        
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Utilizador inativo")
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET_CURRENT_USER] Error querying user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao obter utilizador: {str(e)}")


def require_staff(req: Request, db: Session = Depends(lambda: None)):
    """Requer qualquer utilizador autenticado (staff, admin, coordinator, agent)"""
    try:
        user = get_current_user(req, db)
        return user
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"[REQUIRE_STAFF] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro de autenticação: {str(e)}")


def get_optional_user(req: Request, db: Session = Depends(lambda: None)) -> Optional["User"]:
    """
    Dependency para obter utilizador autenticado, se existir.
    Retorna None se não houver autenticação (para endpoints públicos).
    """
    from app.database import get_db
    from app.users.models import User
    
    if db is None:
        db = next(get_db())
    
    token = extract_token(req)
    if not token:
        return None  # Sem autenticação - acesso público
    
    try:
        payload = decode_token(token)
    except Exception:
        return None  # Token inválido - tratar como acesso público
    
    user_id = payload.get("user_id")
    email = payload.get("email")
    
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    elif email:
        user = db.query(User).filter(User.email == email).first()
    else:
        return None
    
    if user and user.is_active:
        return user
    return None


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
    print(f"[GET_EFFECTIVE_AGENT_ID] Token extracted: {token[:50] if token else 'None'}...")
    
    if not token:
        print("[GET_EFFECTIVE_AGENT_ID] No token found!")
        return None
    
    try:
        payload = decode_token(token)
        agent_id = payload.get("agent_id")
        print(f"[GET_EFFECTIVE_AGENT_ID] Payload: {payload}, agent_id: {agent_id}")
        return agent_id
    except Exception as e:
        print(f"[GET_EFFECTIVE_AGENT_ID] Error decoding token: {e}")
        return None
