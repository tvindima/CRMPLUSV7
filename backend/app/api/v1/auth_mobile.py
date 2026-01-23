"""
Endpoints de autenticação para Mobile App
Login com refresh token, renovação de tokens e gestão multi-device
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional, List

from app.database import get_db
from app.users.models import User
from app.users.refresh_token import RefreshToken
from app.security import create_access_token, SECRET_KEY, ALGORITHM, get_current_user
import jwt
import bcrypt
import re

router = APIRouter(prefix="/auth", tags=["Authentication - Mobile"])


# Schemas
class MobileLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime


class RefreshRequest(BaseModel):
    refresh_token: str


class SessionInfo(BaseModel):
    id: int
    device_name: str
    device_type: str
    ip_address: str
    created_at: datetime
    last_used_at: datetime
    is_current: bool


# =====================================================
# HELPER FUNCTIONS
# =====================================================

def parse_user_agent(user_agent: str) -> tuple:
    """
    Extrai device_type e device_name do User-Agent
    
    Exemplos:
    - iOS: "MyApp/1.0 (iPhone; iOS 16.0)"
    - Android: "MyApp/1.0 (Android 13; Samsung Galaxy S23)"
    """
    if not user_agent:
        return ("Unknown", "Dispositivo Desconhecido")
    
    # Detectar tipo
    device_type = "Unknown"
    if "iPhone" in user_agent or "iPad" in user_agent:
        device_type = "iOS"
    elif "Android" in user_agent:
        device_type = "Android"
    elif "Windows" in user_agent:
        device_type = "Windows"
    elif "Macintosh" in user_agent:
        device_type = "macOS"
    
    # Extrair nome do dispositivo
    device_name = user_agent
    
    # iPhone/iPad pattern
    if "iPhone" in user_agent:
        device_name = "iPhone"
    elif "iPad" in user_agent:
        device_name = "iPad"
    elif "Android" in user_agent:
        # Tentar extrair modelo Android
        match = re.search(r'Android.*?;\s*([^)]+)', user_agent)
        if match:
            device_name = match.group(1).strip()
        else:
            device_name = "Android"
    
    return (device_type, device_name)


def get_client_ip(request: Request) -> str:
    """Extrai IP do cliente (suporta proxies)"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    if request.client:
        return request.client.host
    
    return "Unknown"


# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/mobile/login", response_model=TokenPairResponse)
def mobile_login(
    login_data: MobileLoginRequest,
    request: Request,
    user_agent: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Login para mobile app - retorna access_token + refresh_token
    Requisitos:
    - User deve ter agent_id OU works_for_agent_id (agente ou assistente)
    - Tokens:  access_token (24h), refresh_token (7 dias)
    - JWT inclui agent_id no payload (do próprio ou do agente para quem trabalha)
    - Rastreia dispositivo e IP para multi-device management
    """
    # Buscar user por email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Email ou password inválidos")
    
    # Verificar password (assumindo bcrypt)
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Email ou password inválidos")
    
    # Verificar se user está ativo
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta inativa")
    
    # Determinar agent_id para o token:
    # - Se é assistente (works_for_agent_id), usa o ID do agente para quem trabalha
    # - Se é agente normal (agent_id), usa o próprio ID
    effective_agent_id = user.works_for_agent_id or user.agent_id
    
    if not effective_agent_id:
        raise HTTPException(
            status_code=403,
            detail="Esta app é exclusiva para agentes imobiliários e assistentes. Contacte o administrador."
        )
    
    # ✅ SECURITY: Obter tenant_slug do request para binding no token
    tenant_slug = getattr(request.state, 'tenant_slug', None)
    print(f"[AUTH MOBILE] User: {user.email}, effective_agent_id: {effective_agent_id}, tenant: {tenant_slug}")
    
    # Criar access token (24h) com agent_id efetivo e tenant_slug
    # O assistente opera "em nome do" agente
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        agent_id=effective_agent_id,
        tenant_slug=tenant_slug
    )
    
    # Parse device info
    device_type, device_name = parse_user_agent(user_agent or "")
    client_ip = get_client_ip(request)
    
    # Tentar criar refresh token (7 dias) com device tracking
    # NOTA: Em multi-tenant, a tabela refresh_tokens pode não existir no schema do tenant
    # Nesse caso, usamos o access_token como refresh_token (fallback seguro)
    refresh_token_str = access_token  # Fallback
    
    try:
        refresh_token_str = RefreshToken.generate_token()
        refresh_token_obj = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            device_info=user_agent,
            device_name=device_name,
            device_type=device_type,
            ip_address=client_ip,
            last_used_at=datetime.utcnow(),
            expires_at=RefreshToken.create_expiry(days=7)
        )
        db.add(refresh_token_obj)
        db.commit()
    except Exception as e:
        # Se falhar (ex: tabela não existe no schema), usar access_token como refresh
        print(f"[AUTH MOBILE] ⚠️ Não foi possível criar refresh_token: {e}")
        print(f"[AUTH MOBILE] Usando access_token como fallback para refresh_token")
        db.rollback()
        refresh_token_str = access_token
    
    return TokenPairResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )


@router.post("/refresh", response_model=TokenPairResponse)
def refresh_access_token(
    refresh_data: RefreshRequest,
    request: Request,
    user_agent: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Renova access token usando refresh token
    Implementa token rotation (refresh token antigo é revogado)
    Atualiza last_used_at e IP do dispositivo
    """
    # Buscar refresh token no database
    refresh_token_obj = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_data.refresh_token
    ).first()
    
    if not refresh_token_obj:
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    
    # Validar se token ainda é válido
    if not refresh_token_obj.is_valid():
        raise HTTPException(status_code=401, detail="Refresh token expirado ou revogado")
    
    # Buscar user
    user = db.query(User).filter(User.id == refresh_token_obj.user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilizador inválido ou inativo")
    
    # Verificar se ainda tem agent_id
    if not user.agent_id:
        raise HTTPException(status_code=403, detail="Acesso restrito a agentes")
    
    # Atualizar last_used_at do token antigo (antes de revogar)
    client_ip = get_client_ip(request)
    refresh_token_obj.update_last_used(client_ip)
    
    # TOKEN ROTATION: Revogar refresh token antigo
    refresh_token_obj.revoke()
    
    # Criar novo access token (24h)
    new_access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
        agent_id=user.agent_id
    )
    
    # Parse device info
    device_type, device_name = parse_user_agent(user_agent or "")
    
    # Criar novo refresh token (7 dias) mantendo device info
    new_refresh_token_str = RefreshToken.generate_token()
    new_refresh_token_obj = RefreshToken(
        token=new_refresh_token_str,
        user_id=user.id,
        device_info=user_agent,
        device_name=device_name,
        device_type=device_type,
        ip_address=client_ip,
        last_used_at=datetime.utcnow(),
        expires_at=RefreshToken.create_expiry(days=7)
    )
    db.add(new_refresh_token_obj)
    db.commit()
    
    return TokenPairResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )


@router.post("/logout")
def logout(
    refresh_data: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Logout - revoga refresh token
    Frontend deve eliminar access_token local
    """
    refresh_token_obj = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_data.refresh_token
    ).first()
    
    if refresh_token_obj:
        refresh_token_obj.revoke()
        db.commit()
    
    return {"message": "Logout efetuado com sucesso"}


# =====================================================
# MULTI-DEVICE SESSION MANAGEMENT
# =====================================================

@router.get("/sessions", response_model=List[SessionInfo])
def list_active_sessions(
    current_refresh_token: Optional[str] = Header(None, alias="X-Refresh-Token"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas as sessões ativas do utilizador (todos os dispositivos)
    
    Header: X-Refresh-Token (para identificar sessão atual)
    Retorna lista com device_name, device_type, last_used_at, etc.
    """
    # Buscar todos os refresh tokens ativos do user
    active_tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).order_by(RefreshToken.last_used_at.desc()).all()
    
    sessions = []
    for token in active_tokens:
        is_current = (current_refresh_token and token.token == current_refresh_token)
        
        sessions.append(SessionInfo(
            id=token.id,
            device_name=token.device_name or "Dispositivo Desconhecido",
            device_type=token.device_type or "Unknown",
            ip_address=token.ip_address or "N/A",
            created_at=token.created_at,
            last_used_at=token.last_used_at or token.created_at,
            is_current=is_current
        ))
    
    return sessions


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoga sessão específica (logout de dispositivo remoto)
    
    Permite utilizador fazer logout de dispositivos que não usa mais.
    Ex: "Fazer logout do meu iPhone antigo"
    """
    # Buscar sessão
    session = db.query(RefreshToken).filter(
        RefreshToken.id == session_id,
        RefreshToken.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    if session.is_revoked:
        raise HTTPException(status_code=400, detail="Sessão já revogada")
    
    # Revogar
    session.revoke()
    db.commit()
    
    return {
        "message": f"Logout efetuado em {session.device_name or 'dispositivo'}",
        "device_name": session.device_name,
        "device_type": session.device_type
    }


@router.post("/logout")
def logout(
    request: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Revoga refresh token específico (logout de um dispositivo)
    
    Endpoint chamado pelo mobile app ao fazer logout
    """
    # Find and revoke the refresh token
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token
    ).first()
    
    if refresh_token and not refresh_token.is_revoked:
        refresh_token.revoke()
        db.commit()
        return {"message": "Logout efetuado com sucesso"}
    
    # Mesmo que o token não exista ou já esteja revogado, retornar sucesso
    return {"message": "Logout efetuado com sucesso"}


@router.post("/sessions/revoke-all")
def revoke_all_sessions_except_current(
    current_refresh_token: str = Header(..., alias="X-Refresh-Token"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoga TODAS as sessões EXCETO a atual
    
    Útil para "Fazer logout em todos os dispositivos"
    Requer X-Refresh-Token header para identificar sessão atual
    """
    # Validar que refresh token atual pertence ao user
    current_session = db.query(RefreshToken).filter(
        RefreshToken.token == current_refresh_token,
        RefreshToken.user_id == current_user.id
    ).first()
    
    if not current_session or not current_session.is_valid():
        raise HTTPException(
            status_code=401,
            detail="Refresh token inválido. Use o endpoint /refresh primeiro."
        )
    
    # Revogar todos os outros tokens
    other_sessions = db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.id != current_session.id,
        RefreshToken.is_revoked == False
    ).all()
    
    revoked_count = 0
    for session in other_sessions:
        session.revoke()
        revoked_count += 1
    
    db.commit()
    
    return {
        "message": f"Logout efetuado em {revoked_count} dispositivo(s)",
        "revoked_sessions": revoked_count,
        "current_device": current_session.device_name or "Este dispositivo"
    }
