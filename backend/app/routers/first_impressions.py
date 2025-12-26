"""
Router para First Impressions (Primeiras Impressões)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.first_impression import FirstImpression
from app.properties.models import Property
from app.leads.models import Lead
from app.schemas.first_impression import (
    FirstImpressionCreate,
    FirstImpressionUpdate,
    FirstImpressionResponse,
    FirstImpressionListItem,
    FirstImpressionSignature,
)
from app.security import get_current_user
from app.users.models import User

router = APIRouter(prefix="/mobile/first-impressions", tags=["first-impressions"])


def get_current_agent(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Helper para obter agente do usuário autenticado"""
    if not current_user.agent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário não tem agente associado"
        )
    
    from app.agents.models import Agent
    agent = db.query(Agent).filter(Agent.id == current_user.agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agente não encontrado"
        )
    
    return agent


# ====================================================================
# 1. CREATE - Criar nova First Impression (rascunho)
# ====================================================================

@router.post("", response_model=FirstImpressionResponse, status_code=status.HTTP_201_CREATED)
async def create_first_impression(
    data: FirstImpressionCreate,
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Criar nova First Impression (rascunho).
    
    - **client_name**: Nome completo obrigatório
    - **client_phone**: Telefone obrigatório
    - **property_id**: Opcional (associar a imóvel)
    - **lead_id**: Opcional (associar a lead)
    - **Status inicial**: draft
    """
    try:
        # Validar property_id se fornecido
        if data.property_id:
            property_exists = db.query(Property).filter(Property.id == data.property_id).first()
            if not property_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Imóvel com ID {data.property_id} não encontrado"
                )
        
        # Validar lead_id se fornecido
        if data.lead_id:
            lead_exists = db.query(Lead).filter(Lead.id == data.lead_id).first()
            if not lead_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Lead com ID {data.lead_id} não encontrado"
                )
        
        # Criar First Impression
        new_impression = FirstImpression(
            agent_id=current_agent.id,
            **data.model_dump(),
            status='draft',
        )
        
        db.add(new_impression)
        db.commit()
        db.refresh(new_impression)
        
        print(f"[POST /first-impressions] ✅ Criado ID {new_impression.id} para agent {current_agent.id}")
        
        return new_impression
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[POST /first-impressions] ❌ Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar First Impression: {str(e)}"
        )


# ====================================================================
# 2. LIST - Listar First Impressions (com filtros)
# ====================================================================

@router.get("", response_model=List[FirstImpressionListItem])
async def list_first_impressions(
    status_filter: Optional[str] = Query(None, description="Filtrar por status (draft, signed, completed, cancelled)"),
    property_id: Optional[int] = Query(None, description="Filtrar por imóvel"),
    lead_id: Optional[int] = Query(None, description="Filtrar por lead"),
    search: Optional[str] = Query(None, description="Pesquisar por nome cliente ou NIF"),
    skip: int = Query(0, ge=0, description="Paginação: registos a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Paginação: limite de registos"),
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Listar First Impressions do agente autenticado.
    
    **Filtros disponíveis:**
    - `status`: draft, signed, completed, cancelled
    - `property_id`: Filtrar por imóvel específico
    - `lead_id`: Filtrar por lead específico
    - `search`: Pesquisar por nome ou NIF do cliente
    - `skip` / `limit`: Paginação
    
    **Ordenação:** Mais recentes primeiro (created_at DESC)
    """
    try:
        # Query base
        query = db.query(FirstImpression).filter(
            FirstImpression.agent_id == current_agent.id
        )
        
        # Excluir cancelled por defeito (a não ser que explicitamente pedido)
        if status_filter != 'cancelled':
            query = query.filter(FirstImpression.status != 'cancelled')
        
        # Filtro status
        if status_filter:
            if status_filter not in ['draft', 'signed', 'completed', 'cancelled']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Status inválido. Use: draft, signed, completed ou cancelled"
                )
            query = query.filter(FirstImpression.status == status_filter)
        
        # Filtro property
        if property_id:
            query = query.filter(FirstImpression.property_id == property_id)
        
        # Filtro lead
        if lead_id:
            query = query.filter(FirstImpression.lead_id == lead_id)
        
        # Pesquisa (nome ou NIF)
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    FirstImpression.client_name.ilike(search_term),
                    FirstImpression.client_nif.ilike(search_term),
                )
            )
        
        # Ordenação e paginação
        impressions = (
            query
            .order_by(FirstImpression.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        print(f"[GET /first-impressions] ✅ Query retornou {len(impressions)} registos")
        
        # Debug: verificar campos problemáticos antes da serialização
        for i, imp in enumerate(impressions):
            print(f"[DEBUG] #{i+1} id={imp.id} client_name='{imp.client_name}' client_phone='{imp.client_phone}' status='{imp.status}'")
        
        return impressions
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[GET /first-impressions] ❌ Erro: {e}")
        print(f"[GET /first-impressions] ❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar First Impressions: {str(e)}"
        )


# ====================================================================
# 3. GET ONE - Ver detalhes de uma First Impression
# ====================================================================

@router.get("/{impression_id}", response_model=FirstImpressionResponse)
async def get_first_impression(
    impression_id: int,
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Obter detalhes completos de uma First Impression.
    
    Inclui:
    - Todos os dados CMI
    - Dados do cliente
    - Assinatura (base64 completo)
    - URL do PDF (se gerado)
    """
    try:
        impression = db.query(FirstImpression).filter(
            FirstImpression.id == impression_id,
            FirstImpression.agent_id == current_agent.id  # Só pode ver suas próprias
        ).first()
        
        if not impression:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"First Impression {impression_id} não encontrada"
            )
        
        print(f"[GET /first-impressions/{impression_id}] ✅ Retornando detalhes")
        
        return impression
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET /first-impressions/{impression_id}] ❌ Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter First Impression: {str(e)}"
        )


# ====================================================================
# 4. UPDATE - Atualizar First Impression
# ====================================================================

@router.put("/{impression_id}", response_model=FirstImpressionResponse)
async def update_first_impression(
    impression_id: int,
    data: FirstImpressionUpdate,
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Atualizar First Impression existente.
    
    - Todos os campos são opcionais
    - Só pode atualizar status 'draft' ou 'signed'
    - Status 'completed' ou 'cancelled' são finais (imutáveis)
    """
    try:
        # Buscar impression
        impression = db.query(FirstImpression).filter(
            FirstImpression.id == impression_id,
            FirstImpression.agent_id == current_agent.id
        ).first()
        
        if not impression:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"First Impression {impression_id} não encontrada"
            )
        
        # Validar se pode editar (status final é imutável)
        if impression.status in ['completed', 'cancelled']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Não é possível editar First Impression com status '{impression.status}'"
            )
        
        # Validar property_id se fornecido
        if data.property_id is not None:
            if data.property_id > 0:
                property_exists = db.query(Property).filter(Property.id == data.property_id).first()
                if not property_exists:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Imóvel com ID {data.property_id} não encontrado"
                    )
        
        # Validar lead_id se fornecido
        if data.lead_id is not None:
            if data.lead_id > 0:
                lead_exists = db.query(Lead).filter(Lead.id == data.lead_id).first()
                if not lead_exists:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Lead com ID {data.lead_id} não encontrado"
                    )
        
        # Atualizar campos fornecidos
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(impression, field, value)
        
        # Atualizar timestamp
        impression.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(impression)
        
        print(f"[PUT /first-impressions/{impression_id}] ✅ Atualizado com sucesso")
        
        return impression
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[PUT /first-impressions/{impression_id}] ❌ Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar First Impression: {str(e)}"
        )


# ====================================================================
# 5. ADD SIGNATURE - Adicionar assinatura digital
# ====================================================================

@router.post("/{impression_id}/signature", response_model=FirstImpressionResponse)
async def add_signature(
    impression_id: int,
    signature_data: FirstImpressionSignature,
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Adicionar assinatura digital à First Impression.
    
    - Assinatura em formato base64 (PNG)
    - Muda status de 'draft' → 'signed'
    - Regista data/hora da assinatura
    """
    try:
        # Buscar impression
        impression = db.query(FirstImpression).filter(
            FirstImpression.id == impression_id,
            FirstImpression.agent_id == current_agent.id
        ).first()
        
        if not impression:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"First Impression {impression_id} não encontrada"
            )
        
        # Validar status (só draft pode receber assinatura)
        if impression.status != 'draft':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Só é possível assinar documentos com status 'draft' (atual: {impression.status})"
            )
        
        # Adicionar assinatura
        impression.signature_image = signature_data.signature_image
        impression.signature_date = datetime.now(timezone.utc)
        impression.status = 'signed'
        impression.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(impression)
        
        print(f"[POST /first-impressions/{impression_id}/signature] ✅ Assinatura adicionada")
        
        return impression
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[POST /first-impressions/{impression_id}/signature] ❌ Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao adicionar assinatura: {str(e)}"
        )


# ====================================================================
# 6. CANCEL - Cancelar First Impression (soft delete)
# ====================================================================

@router.post("/{impression_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_first_impression(
    impression_id: int,
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Cancelar First Impression (soft delete).
    
    - Marca status como 'cancelled'
    - Não apaga da base de dados
    - Pode cancelar mesmo se já assinada
    """
    try:
        # Buscar impression (do agente autenticado)
        impression = db.query(FirstImpression).filter(
            FirstImpression.id == impression_id,
            FirstImpression.agent_id == current_agent.id
        ).first()
        
        if not impression:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"First Impression {impression_id} não encontrada"
            )
        
        # Já cancelada?
        if impression.status == 'cancelled':
            return {"message": "Já estava cancelada", "id": impression_id}
        
        # Marcar como cancelled
        impression.status = 'cancelled'
        impression.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        print(f"[POST /first-impressions/{impression_id}/cancel] ✅ Cancelado com sucesso")
        
        return {"message": "Cancelado com sucesso", "id": impression_id}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[POST /first-impressions/{impression_id}/cancel] ❌ Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao cancelar First Impression: {str(e)}"
        )


# ====================================================================
# 7. DELETE - Apagar First Impression
# ====================================================================

@router.delete("/{impression_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_first_impression(
    impression_id: int,
    db: Session = Depends(get_db),
    current_agent = Depends(get_current_agent),
):
    """
    Apagar First Impression.
    
    - Só pode apagar suas próprias
    - Apagar é permanente (hard delete)
    - Alternativa: usar PUT para mudar status → 'cancelled'
    """
    try:
        # Buscar impression
        impression = db.query(FirstImpression).filter(
            FirstImpression.id == impression_id,
            FirstImpression.agent_id == current_agent.id
        ).first()
        
        if not impression:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"First Impression {impression_id} não encontrada"
            )
        
        # Apagar
        db.delete(impression)
        db.commit()
        
        print(f"[DELETE /first-impressions/{impression_id}] ✅ Apagado com sucesso")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"[DELETE /first-impressions/{impression_id}] ❌ Erro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao apagar First Impression: {str(e)}"
        )
