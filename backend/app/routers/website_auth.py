"""
Rotas de autenticação para clientes do website (compradores/interessados)
Endpoints PÚBLICOS - sem autenticação de agente
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
import os

from app.database import get_db
from app.models.website_client import WebsiteClient
from app.schemas.website_client import (
    WebsiteClientRegister,
    WebsiteClientLogin,
    WebsiteClientOut,
    WebsiteClientUpdate,
    WebsiteClientToken
)
from app.users.services import hash_password, verify_password

router = APIRouter(prefix="/website/auth", tags=["Website Client Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "crmplusv7-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30  # Token válido por 30 dias para clientes


def create_client_token(client_id: int, email: str) -> str:
    """Criar JWT token para cliente do website"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(client_id),
        "email": email,
        "type": "website_client",
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_client(token: str, db: Session) -> WebsiteClient:
    """Validar token e retornar cliente"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "website_client":
            raise HTTPException(status_code=401, detail="Token inválido")
        client_id = int(payload.get("sub"))
        client = db.query(WebsiteClient).filter(WebsiteClient.id == client_id).first()
        if not client or not client.is_active:
            raise HTTPException(status_code=401, detail="Cliente não encontrado")
        return client
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


@router.post("/register", response_model=WebsiteClientToken, status_code=201)
def register_client(
    data: WebsiteClientRegister,
    db: Session = Depends(get_db)
):
    """
    Registar novo cliente do website.
    Endpoint PÚBLICO.
    """
    # Verificar se email já existe
    existing = db.query(WebsiteClient).filter(
        WebsiteClient.email == data.email.lower()
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Este email já está registado. Tente fazer login."
        )
    
    # Validar password
    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="A password deve ter pelo menos 6 caracteres"
        )
    
    # Criar cliente
    client = WebsiteClient(
        name=data.name,
        email=data.email.lower(),
        phone=data.phone,
        hashed_password=hash_password(data.password),
        is_active=True,
        is_verified=False,  # TODO: Implementar verificação por email
        last_login=datetime.utcnow()
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    # Gerar token
    token = create_client_token(client.id, client.email)
    
    return WebsiteClientToken(
        access_token=token,
        client=WebsiteClientOut.model_validate(client)
    )


@router.post("/login", response_model=WebsiteClientToken)
def login_client(
    data: WebsiteClientLogin,
    db: Session = Depends(get_db)
):
    """
    Login de cliente do website.
    Endpoint PÚBLICO.
    """
    # Buscar cliente
    client = db.query(WebsiteClient).filter(
        WebsiteClient.email == data.email.lower()
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=401,
            detail="Email ou password incorretos"
        )
    
    # Verificar password
    if not verify_password(data.password, client.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Email ou password incorretos"
        )
    
    # Verificar se está ativo
    if not client.is_active:
        raise HTTPException(
            status_code=403,
            detail="Conta desativada. Contacte o suporte."
        )
    
    # Atualizar último login
    client.last_login = datetime.utcnow()
    db.commit()
    
    # Gerar token
    token = create_client_token(client.id, client.email)
    
    return WebsiteClientToken(
        access_token=token,
        client=WebsiteClientOut.model_validate(client)
    )


@router.get("/me", response_model=WebsiteClientOut)
def get_current_client_info(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Obter dados do cliente logado.
    Requer token no query param: /me?token=xxx
    """
    client = get_current_client(token, db)
    return WebsiteClientOut.model_validate(client)


@router.put("/me", response_model=WebsiteClientOut)
def update_client_info(
    token: str,
    data: WebsiteClientUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualizar dados do cliente.
    Requer token no query param: /me?token=xxx
    """
    client = get_current_client(token, db)
    
    # Atualizar campos
    if data.name is not None:
        client.name = data.name
    if data.phone is not None:
        client.phone = data.phone
    if data.receive_alerts is not None:
        client.receive_alerts = data.receive_alerts
    if data.search_preferences is not None:
        client.search_preferences = data.search_preferences
    
    client.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(client)
    
    return WebsiteClientOut.model_validate(client)


@router.post("/validate", response_model=WebsiteClientOut)
def validate_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validar se um token é válido e retornar dados do cliente.
    Útil para verificar sessão ao carregar página.
    """
    client = get_current_client(token, db)
    return WebsiteClientOut.model_validate(client)
