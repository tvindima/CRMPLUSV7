"""
Routes API para Pré-Angariação
CRUD completo + gestão de documentos, fotos e checklist
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
import logging

from app.database import get_db, SQLALCHEMY_DATABASE_URL
from app.security import get_current_user
from app.users.models import User
from app.models.pre_angariacao import PreAngariacao, PreAngariacaoStatus
from app.models.first_impression import FirstImpression
from app.properties.models import Property
from app.schemas import pre_angariacao as schemas
from app.users.models import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pre-angariacoes", tags=["Pré-Angariações"])


# =====================================================
# CRUD Básico
# =====================================================

@router.get("/", response_model=List[schemas.PreAngariacaoListItem])
def listar_pre_angariacoes(
    status: Optional[str] = Query(None, description="Filtrar por status"),
    agent_id: Optional[int] = Query(None, description="Filtrar por agente (apenas admin)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todas as pré-angariações do agente
    """
    # Perfis com permissão total
    privileged_roles = {UserRole.ADMIN.value, "staff", "leader", UserRole.COORDINATOR.value}
    is_admin = current_user.role in privileged_roles

    if not is_admin and not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    query = db.query(PreAngariacao).options(joinedload(PreAngariacao.agent))

    if not is_admin:
        query = query.filter(PreAngariacao.agent_id == current_user.agent_id, PreAngariacao.status != PreAngariacaoStatus.CANCELADO)
    elif agent_id:
        query = query.filter(PreAngariacao.agent_id == agent_id)
    
    if status:
        query = query.filter(PreAngariacao.status == status)
    
    items = query.order_by(desc(PreAngariacao.created_at)).offset(skip).limit(limit).all()
    return items


@router.get("/by-first-impression/{first_impression_id}", response_model=schemas.PreAngariacaoResponse)
def obter_por_first_impression(
    first_impression_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter pré-angariação associada a uma 1ª impressão (se existir)"""
    privileged_roles = {UserRole.ADMIN.value, "staff", "leader", UserRole.COORDINATOR.value}
    is_admin = current_user.role in privileged_roles
    if not is_admin and not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    query = db.query(PreAngariacao).options(joinedload(PreAngariacao.agent)).filter(
        PreAngariacao.first_impression_id == first_impression_id
    )
    if not is_admin:
        query = query.filter(PreAngariacao.agent_id == current_user.agent_id)
    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada para esta 1ª impressão")
    return item


@router.get("/stats", response_model=schemas.PreAngariacaoStats)
def obter_estatisticas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter estatísticas das pré-angariações do agente
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    base_query = db.query(PreAngariacao).filter(
        PreAngariacao.agent_id == current_user.agent_id
    )
    
    total = base_query.count()
    em_progresso = base_query.filter(
        PreAngariacao.status.in_([PreAngariacaoStatus.INICIAL, PreAngariacaoStatus.EM_PROGRESSO, 
                                   PreAngariacaoStatus.DOCUMENTOS_OK, PreAngariacaoStatus.FOTOS_OK,
                                   PreAngariacaoStatus.CONTRATO_OK])
    ).count()
    completas = base_query.filter(PreAngariacao.status == PreAngariacaoStatus.COMPLETO).count()
    activadas = base_query.filter(PreAngariacao.status == PreAngariacaoStatus.ACTIVADO).count()
    canceladas = base_query.filter(PreAngariacao.status == PreAngariacaoStatus.CANCELADO).count()
    
    return schemas.PreAngariacaoStats(
        total=total,
        em_progresso=em_progresso,
        completas=completas,
        activadas=activadas,
        canceladas=canceladas
    )


@router.get("/{pre_angariacao_id}", response_model=schemas.PreAngariacaoResponse)
def obter_pre_angariacao(
    pre_angariacao_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de uma pré-angariação
    """
    privileged_roles = {UserRole.ADMIN.value, "staff", "leader", UserRole.COORDINATOR.value}
    is_admin = current_user.role in privileged_roles
    if not is_admin and not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item_query = db.query(PreAngariacao).options(joinedload(PreAngariacao.agent)).filter(PreAngariacao.id == pre_angariacao_id)
    if not is_admin:
        item_query = item_query.filter(PreAngariacao.agent_id == current_user.agent_id)
    item = item_query.first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    return item


@router.post("/", response_model=schemas.PreAngariacaoResponse, status_code=201)
def criar_pre_angariacao(
    data: schemas.PreAngariacaoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar nova pré-angariação
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Gerar referência interna
    ano = datetime.now().year
    count = db.query(PreAngariacao).filter(
        PreAngariacao.agent_id == current_user.agent_id,
        func.extract('year', PreAngariacao.created_at) == ano
    ).count()
    referencia = f"PA-{ano}-{count + 1:03d}"
    
    # Criar pré-angariação
    pre_ang = PreAngariacao(
        agent_id=current_user.agent_id,
        referencia_interna=referencia,
        checklist=PreAngariacao.checklist_padrao(),
        **data.model_dump(exclude={'first_impression_id'})
    )
    
    # Associar 1ª Impressão se fornecida
    if data.first_impression_id:
        fi = db.query(FirstImpression).filter(
            FirstImpression.id == data.first_impression_id,
            FirstImpression.agent_id == current_user.agent_id
        ).first()
        if fi:
            pre_ang.first_impression_id = fi.id
            # Marcar item do checklist
            for item in pre_ang.checklist:
                if item['id'] == 'first_impression':
                    item['completed'] = True
                    item['completed_at'] = datetime.now().isoformat()
    
    pre_ang.atualizar_status()
    
    db.add(pre_ang)
    db.commit()
    db.refresh(pre_ang)
    
    logger.info(f"Pré-angariação criada: {referencia} por agent_id={current_user.agent_id}")
    return pre_ang


@router.post("/from-first-impression", response_model=schemas.PreAngariacaoResponse, status_code=201)
def criar_de_first_impression(
    data: schemas.PreAngariacaoCreateFromFirstImpression,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Criar pré-angariação a partir de uma 1ª Impressão existente
    Copia automaticamente os dados do cliente e imóvel
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Buscar 1ª Impressão
    fi = db.query(FirstImpression).filter(
        FirstImpression.id == data.first_impression_id,
        FirstImpression.agent_id == current_user.agent_id
    ).first()
    
    if not fi:
        raise HTTPException(status_code=404, detail="1ª Impressão não encontrada")
    
    # Verificar se já existe pré-angariação para esta 1ª Impressão
    existing = db.query(PreAngariacao).filter(
        PreAngariacao.first_impression_id == fi.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Já existe pré-angariação ({existing.referencia_interna}) para esta 1ª Impressão"
        )
    
    # Gerar referência
    ano = datetime.now().year
    count = db.query(PreAngariacao).filter(
        PreAngariacao.agent_id == current_user.agent_id,
        func.extract('year', PreAngariacao.created_at) == ano
    ).count()
    referencia = f"PA-{ano}-{count + 1:03d}"
    
    # Criar checklist com 1ª Impressão já marcada
    checklist = PreAngariacao.checklist_padrao()
    for item in checklist:
        if item['id'] == 'first_impression':
            item['completed'] = True
            item['completed_at'] = datetime.now().isoformat()
    
    # Criar pré-angariação com dados da 1ª Impressão
    pre_ang = PreAngariacao(
        agent_id=current_user.agent_id,
        first_impression_id=fi.id,
        referencia_interna=referencia,
        
        # Dados do proprietário
        proprietario_nome=fi.client_name,
        proprietario_nif=fi.client_nif,
        proprietario_telefone=fi.client_phone,
        proprietario_email=fi.client_email,
        
        # Localização
        morada=fi.location,
        freguesia=fi.freguesia,
        concelho=fi.concelho,
        distrito=fi.distrito,
        latitude=fi.latitude,
        longitude=fi.longitude,
        
        # Características
        tipologia=fi.tipologia,
        area_bruta=fi.area_bruta,
        area_util=fi.area_util,
        ano_construcao=fi.ano_construcao,
        estado_conservacao=fi.estado_conservacao,
        
        # Valores
        valor_pretendido=fi.valor_estimado,
        
        # Notas
        notas=fi.observations,
        
        # Checklist
        checklist=checklist,
        
        # Data visita
        data_primeira_visita=fi.created_at
    )

    # Copiar anexos da 1ª impressão como documentos iniciais
    documentos_iniciais = []
    for att in fi.attachments or []:
        url = att.get('url')
        if not url:
            continue
        documentos_iniciais.append({
            "type": att.get('type') or "outro",
            "name": att.get('name') or att.get('filename') or "Anexo",
            "url": url,
            "uploaded_at": (fi.created_at or datetime.now()).isoformat(),
            "status": "uploaded",
            "notes": att.get('notes')
        })
    if documentos_iniciais:
        pre_ang.documentos = documentos_iniciais

    # Copiar fotos da 1ª impressão
    fotos_iniciais = []
    for idx, foto in enumerate(fi.photos or []):
        url = foto if isinstance(foto, str) else foto.get('url')
        if not url:
            continue
        fotos_iniciais.append({
            "url": url,
            "caption": None if isinstance(foto, str) else foto.get('caption'),
            "room_type": None,
            "order": idx,
            "uploaded_at": (fi.created_at or datetime.now()).isoformat()
        })
    if fotos_iniciais:
        pre_ang.fotos = fotos_iniciais

    # Marcar checklist com base nos docs/fotos copiados
    checklist_map = {
        "caderneta_predial": "caderneta",
        "certidao_permanente": "certidao",
        "licenca_utilizacao": "licenca",
        "certificado_energetico": "certificado_energetico",
        "contrato_mediacao": "contrato",
        "documentos_proprietario": "docs_proprietario"
    }
    if documentos_iniciais:
        for doc in documentos_iniciais:
            if doc["type"] in checklist_map:
                checklist_id = checklist_map[doc["type"]]
                for item in pre_ang.checklist or []:
                    if item["id"] == checklist_id and not item.get("completed"):
                        item["completed"] = True
                        item["completed_at"] = datetime.now().isoformat()
                        break
    if fotos_iniciais and len(fotos_iniciais) >= 5:
        for item in pre_ang.checklist or []:
            if item["id"] == "fotos" and not item.get("completed"):
                item["completed"] = True
                item["completed_at"] = datetime.now().isoformat()
                break
    
    pre_ang.atualizar_status()
    
    db.add(pre_ang)
    db.commit()
    db.refresh(pre_ang)
    
    logger.info(f"Pré-angariação criada de 1ª Impressão: {referencia}")
    return pre_ang


@router.put("/{pre_angariacao_id}", response_model=schemas.PreAngariacaoResponse)
def atualizar_pre_angariacao(
    pre_angariacao_id: int,
    data: schemas.PreAngariacaoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar dados de uma pré-angariação
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(PreAngariacao).filter(
        PreAngariacao.id == pre_angariacao_id,
        PreAngariacao.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    payload = data.model_dump(exclude_unset=True)
    fotos_payload = payload.pop("fotos", None)

    # Atualizar campos simples
    for field, value in payload.items():
        setattr(item, field, value)

    # Substituir fotos se enviadas
    if fotos_payload is not None:
        item.fotos = fotos_payload
        flag_modified(item, "fotos")
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{pre_angariacao_id}")
def eliminar_pre_angariacao(
    pre_angariacao_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar pré-angariação (ou marcar como cancelada)
    """
    privileged_roles = {UserRole.ADMIN.value, "staff", "leader", UserRole.COORDINATOR.value}
    is_admin = current_user.role in privileged_roles
    if not is_admin and not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item_query = db.query(PreAngariacao).filter(PreAngariacao.id == pre_angariacao_id)
    if not is_admin:
        item_query = item_query.filter(PreAngariacao.agent_id == current_user.agent_id)
    item = item_query.first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    # Marcar como cancelada em vez de eliminar
    item.status = PreAngariacaoStatus.CANCELADO
    flag_modified(item, "status")

    # Se existir 1ª impressão ligada, marcar como cancelada também (para desaparecer do mobile)
    try:
        from app.models.first_impression import FirstImpression
        if item.first_impression_id:
            fi = db.query(FirstImpression).filter(FirstImpression.id == item.first_impression_id).first()
            if fi:
                fi.status = "cancelled"
                fi.updated_at = func.now()
    except Exception as e:
        logger.warning(f"Não foi possível marcar 1ª impressão como cancelada: {e}")

    db.commit()
    
    return {"message": "Pré-angariação cancelada", "id": pre_angariacao_id}


# =====================================================
# Gestão de Documentos
# =====================================================

@router.post("/{pre_angariacao_id}/documentos", response_model=schemas.PreAngariacaoResponse)
def adicionar_documento(
    pre_angariacao_id: int,
    doc: schemas.AddDocumentoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adicionar documento à pré-angariação
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(PreAngariacao).filter(
        PreAngariacao.id == pre_angariacao_id,
        PreAngariacao.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    # Adicionar documento
    docs = item.documentos or []
    docs.append({
        "type": doc.type,
        "name": doc.name,
        "url": doc.url,
        "uploaded_at": datetime.now().isoformat(),
        "status": "uploaded",
        "notes": doc.notes
    })
    item.documentos = docs
    # Garantir que o SQLAlchemy detecta a mutação do JSON
    flag_modified(item, "documentos")
    
    # Atualizar checklist se for documento obrigatório
    checklist_map = {
        "caderneta_predial": "caderneta",
        "certidao_permanente": "certidao",
        "licenca_utilizacao": "licenca",
        "certificado_energetico": "certificado_energetico",
        "contrato_mediacao": "contrato",
        "documentos_proprietario": "docs_proprietario"
    }
    
    if doc.type in checklist_map:
        checklist_id = checklist_map[doc.type]
        for check_item in (item.checklist or []):
            if check_item['id'] == checklist_id and not check_item['completed']:
                check_item['completed'] = True
                check_item['completed_at'] = datetime.now().isoformat()
                break
        
        # Se for contrato, atualizar data
        if doc.type == "contrato_mediacao":
            item.data_contrato = datetime.now()
    
    item.atualizar_status()
    
    db.commit()
    db.refresh(item)
    
    db_target = SQLALCHEMY_DATABASE_URL.split("@")[-1] if SQLALCHEMY_DATABASE_URL else "sqlite"
    logger.info(f"Documento {doc.type} adicionado a PA {item.referencia_interna} (docs: {len(item.documentos)}) [db={db_target}]")
    return item


@router.delete("/{pre_angariacao_id}/documentos/{doc_index}")
def remover_documento(
    pre_angariacao_id: int,
    doc_index: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remover documento por índice
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(PreAngariacao).filter(
        PreAngariacao.id == pre_angariacao_id,
        PreAngariacao.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    docs = item.documentos or []
    if doc_index < 0 or doc_index >= len(docs):
        raise HTTPException(status_code=400, detail="Índice de documento inválido")
    
    removed = docs.pop(doc_index)
    item.documentos = docs
    item.atualizar_status()
    
    db.commit()
    return {"message": "Documento removido", "removed": removed}


# =====================================================
# Gestão de Fotos
# =====================================================

@router.post("/{pre_angariacao_id}/fotos", response_model=schemas.PreAngariacaoResponse)
def adicionar_foto(
    pre_angariacao_id: int,
    foto: schemas.AddFotoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Adicionar foto à pré-angariação
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(PreAngariacao).filter(
        PreAngariacao.id == pre_angariacao_id,
        PreAngariacao.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    # Adicionar foto
    fotos = item.fotos or []
    fotos.append({
        "url": foto.url,
        "caption": foto.caption,
        "room_type": foto.room_type,
        "order": foto.order,
        "uploaded_at": datetime.now().isoformat()
    })
    item.fotos = fotos
    flag_modified(item, "fotos")
    
    # Atualizar checklist se tiver >= 5 fotos
    if len(fotos) >= 5:
        for check_item in (item.checklist or []):
            if check_item['id'] == 'fotos' and not check_item['completed']:
                check_item['completed'] = True
                check_item['completed_at'] = datetime.now().isoformat()
                break
    
    item.atualizar_status()
    
    db.commit()
    db.refresh(item)
    return item


# =====================================================
# Checklist
# =====================================================

@router.put("/{pre_angariacao_id}/checklist", response_model=schemas.PreAngariacaoResponse)
def atualizar_checklist(
    pre_angariacao_id: int,
    data: schemas.UpdateChecklistRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar item do checklist
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(PreAngariacao).filter(
        PreAngariacao.id == pre_angariacao_id,
        PreAngariacao.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    # Encontrar e atualizar item
    found = False
    for check_item in (item.checklist or []):
        if check_item['id'] == data.item_id:
            check_item['completed'] = data.completed
            check_item['completed_at'] = datetime.now().isoformat() if data.completed else None
            if data.notes:
                check_item['notes'] = data.notes
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=400, detail=f"Item '{data.item_id}' não encontrado no checklist")
    
    item.atualizar_status()
    flag_modified(item, "checklist")
    
    db.commit()
    db.refresh(item)
    return item


# =====================================================
# Activar como Imóvel
# =====================================================

@router.post("/{pre_angariacao_id}/activar", response_model=schemas.PreAngariacaoResponse)
def activar_como_imovel(
    pre_angariacao_id: int,
    data: schemas.ActivarAngariacaoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Converter pré-angariação em imóvel ativo para venda
    Cria um novo Property com todos os dados e fotos
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(PreAngariacao).filter(
        PreAngariacao.id == pre_angariacao_id,
        PreAngariacao.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Pré-angariação não encontrada")
    
    if item.status == PreAngariacaoStatus.ACTIVADO:
        raise HTTPException(status_code=400, detail="Esta pré-angariação já foi activada")
    
    if item.status == PreAngariacaoStatus.CANCELADO:
        raise HTTPException(status_code=400, detail="Não é possível activar uma pré-angariação cancelada")
    
    # Verificar se está completa
    progresso = item.calcular_progresso()
    if progresso < 70:
        raise HTTPException(
            status_code=400, 
            detail=f"Pré-angariação com apenas {progresso}% completa. Mínimo recomendado: 70%"
        )
    
    # Gerar referência do imóvel
    from datetime import datetime
    ref = f"IMO-{datetime.now().strftime('%Y%m%d')}-{item.id:04d}"
    
    # Criar Property
    property_obj = Property(
        reference=ref,
        title=data.titulo,
        description=data.descricao,
        business_type=data.business_type,
        property_type="apartamento",  # TODO: adicionar campo
        typology=item.tipologia,
        price=float(data.preco_venda),
        usable_area=float(item.area_util) if item.area_util else None,
        land_area=float(item.area_bruta) if item.area_bruta else None,
        location=item.morada,
        municipality=item.concelho,
        parish=item.freguesia,
        condition=item.estado_conservacao,
        agent_id=current_user.agent_id,
        latitude=float(item.latitude) if item.latitude else None,
        longitude=float(item.longitude) if item.longitude else None,
        images=[f['url'] for f in (item.fotos or [])],
        is_published=1,
        is_featured=0,
        status="AVAILABLE",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(property_obj)
    db.flush()  # Para obter o ID
    
    # Atualizar pré-angariação
    item.property_id = property_obj.id
    item.status = PreAngariacaoStatus.ACTIVADO
    item.data_activacao = datetime.now()
    item.valor_final = data.preco_venda
    
    db.commit()
    db.refresh(item)
    
    logger.info(f"Pré-angariação {item.referencia_interna} activada como imóvel {ref}")
    
    return item
