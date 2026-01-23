import os
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import APIRouter, HTTPException, Response
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.schemas.auth import LoginRequest, TokenResponse
from app.security import decode_token, extract_token, SECRET_KEY, ALGORITHM
from app.database import get_db
from app.users import authenticate_user

router = APIRouter(prefix="/auth", tags=["Auth"])

# Usar mesma SECRET_KEY do security.py para consistência
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def _create_token(user_id: int, email: str, role: str, agent_id: int = None, tenant_slug: str = None) -> TokenResponse:
    expires = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "user_id": user_id,
        "email": email,
        "role": role,
        "agent_id": agent_id,  # ✅ Incluir agent_id no token
        "tenant_slug": tenant_slug,  # ✅ SECURITY: Binding ao tenant para evitar cross-tenant access
        "exp": expires,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return TokenResponse(access_token=token, token_type="bearer", expires_at=expires)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    """Autenticação de utilizadores."""
    
    try:
        # Autenticar utilizador via database
        user = authenticate_user(db, payload.email, payload.password)
        
        if not user:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # ✅ Para assistentes, usar works_for_agent_id como agent_id efetivo
        effective_agent_id = user.works_for_agent_id if user.works_for_agent_id else user.agent_id
        
        # ✅ SECURITY: Obter tenant_slug do request para binding no token
        tenant_slug = getattr(request.state, 'tenant_slug', None)
        print(f"[AUTH LOGIN] User: {user.email}, Role: {user.role}, agent_id: {user.agent_id}, works_for: {user.works_for_agent_id}, effective: {effective_agent_id}, tenant: {tenant_slug}")
        
        token = _create_token(user.id, user.email, user.role, effective_agent_id, tenant_slug)
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
    from app.agents.models import Agent
    
    user = get_current_user(request, db)
    
    # Buscar agent_id pelo email do utilizador
    agent_id = None
    agent = db.query(Agent).filter(Agent.email == user.email).first()
    if agent:
        agent_id = agent.id
    
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.full_name,
        "is_active": user.is_active,
        "avatar_url": user.avatar_url,
        "agent_id": agent_id,  # CRITICAL: Mobile precisa disto para filtrar clientes
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
