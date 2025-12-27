import os
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import APIRouter, HTTPException, Response
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.schemas.auth import LoginRequest, TokenResponse
from app.security import decode_token, extract_token
from app.database import get_db
from app.users import authenticate_user

router = APIRouter(prefix="/auth", tags=["Auth"])

# Valores de exemplo; em produção, definir SECRET_KEY via env.
SECRET_KEY = os.environ.get("CRMPLUS_AUTH_SECRET", "change_me_crmplus_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


@router.get("/debug-user/{email}")
def debug_user(email: str, db: Session = Depends(get_db)):
    """DEBUG: Verificar estado do user (REMOVER EM PRODUÇÃO)"""
    from app.users.models import User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"found": False, "email": email}
    return {
        "found": True,
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "has_password": bool(user.hashed_password),
        "password_length": len(user.hashed_password) if user.hashed_password else 0
    }


def _create_token(user_id: int, email: str, role: str, agent_id: int = None) -> TokenResponse:
    expires = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "user_id": user_id,
        "email": email,
        "role": role,
        "agent_id": agent_id,  # ✅ Incluir agent_id no token
        "exp": expires,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return TokenResponse(access_token=token, token_type="bearer", expires_at=expires)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    """Autenticação de utilizadores."""
    
    try:
        # Autenticar utilizador via database
        user = authenticate_user(db, payload.email, payload.password)
        
        if not user:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # ✅ Para assistentes, usar works_for_agent_id como agent_id efetivo
        effective_agent_id = user.works_for_agent_id if user.works_for_agent_id else user.agent_id
        print(f"[AUTH LOGIN] User: {user.email}, Role: {user.role}, agent_id: {user.agent_id}, works_for: {user.works_for_agent_id}, effective: {effective_agent_id}")
        
        token = _create_token(user.id, user.email, user.role, effective_agent_id)
    except Exception as e:
        import traceback
        error_details = {
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        raise HTTPException(status_code=500, detail=error_details)
    
    # Define cookie httpOnly para o front consumir via middleware
    response.set_cookie(
        key="crmplus_staff_session",
        value=token.access_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return token


@router.get("/me")
def me(request: Request, db: Session = Depends(get_db)):
    from app.security import get_current_user
    user = get_current_user(request, db)
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "is_active": user.is_active,
        "avatar_url": user.avatar_url,
        "valid": True,
    }


@router.post("/verify")
def verify(request: Request, db: Session = Depends(get_db)):
    from app.security import get_current_user
    user = get_current_user(request, db)
    return {
        "valid": True,
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
    }


@router.post("/logout")
def logout(response: Response):
    """Logout: remove cookie de sessão."""
    response.delete_cookie(
        key="crmplus_staff_session",
        path="/",
        samesite="none"
    )
    return {"message": "Logout efetuado com sucesso"}


# Dependency para obter email do utilizador autenticado
def get_current_user_email(request: Request) -> str:
    """Extrai email do token JWT do utilizador autenticado."""
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    payload = decode_token(token)
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")
    return email
