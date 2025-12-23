"""
Routes API para CMI - Contrato de Mediação Imobiliária
CRUD + OCR + Assinaturas + PDF
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
import logging
import re

from app.database import get_db
from app.security import get_current_user
from app.users.models import User
from app.models.contrato_mediacao import ContratoMediacaoImobiliaria, CMIStatus, TipoContrato
from app.models.first_impression import FirstImpression
from app.agents.models import Agent
from app.agencies.models import Agency
from app.schemas import contrato_mediacao as schemas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cmi", tags=["Contratos Mediação (CMI)"])


# =====================================================
# Dados do Mediador (carregados automaticamente)
# =====================================================

def get_dados_mediador(agent_id: int, db: Session) -> dict:
    """Obter dados do mediador/agência do agente"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return {}
    
    # Tentar obter dados da agência
    agency = db.query(Agency).filter(Agency.id == agent.agency_id).first() if agent.agency_id else None
    
    if agency:
        return {
            "mediador_nome": agency.name,
            "mediador_licenca_ami": agency.license_ami or "AMI-XXXXX",
            "mediador_nif": agency.nif or "",
            "mediador_morada": agency.address,
            "mediador_codigo_postal": agency.postal_code,
            "mediador_telefone": agency.phone,
            "mediador_email": agency.email,
            "agente_nome": agent.name,
            "agente_carteira_profissional": agent.license_ami,  # Licença do agente
        }
    else:
        # Usar dados do agente como fallback
        return {
            "mediador_nome": agent.name,
            "mediador_licenca_ami": agent.license_ami or "AMI-XXXXX",
            "mediador_nif": "",
            "mediador_morada": "",
            "mediador_codigo_postal": "",
            "mediador_telefone": agent.phone,
            "mediador_email": agent.email,
            "agente_nome": agent.name,
            "agente_carteira_profissional": agent.license_ami,
        }


# =====================================================
# CRUD Básico
# =====================================================

@router.get("/", response_model=List[schemas.CMIListItem])
def listar_cmis(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todos os CMIs do agente"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    query = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    )
    
    if status:
        query = query.filter(ContratoMediacaoImobiliaria.status == status)
    
    items = query.order_by(desc(ContratoMediacaoImobiliaria.created_at)).offset(skip).limit(limit).all()
    return items


@router.get("/stats", response_model=schemas.CMIStats)
def obter_estatisticas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter estatísticas dos CMIs"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    base = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    )
    
    return schemas.CMIStats(
        total=base.count(),
        rascunhos=base.filter(ContratoMediacaoImobiliaria.status == CMIStatus.RASCUNHO).count(),
        pendentes=base.filter(ContratoMediacaoImobiliaria.status == CMIStatus.PENDENTE_ASSINATURA).count(),
        assinados=base.filter(ContratoMediacaoImobiliaria.status == CMIStatus.ASSINADO).count(),
        cancelados=base.filter(ContratoMediacaoImobiliaria.status == CMIStatus.CANCELADO).count(),
    )


@router.get("/{cmi_id}", response_model=schemas.CMIResponse)
def obter_cmi(
    cmi_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de um CMI"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    return item


@router.post("/", response_model=schemas.CMIResponse, status_code=201)
def criar_cmi(
    data: schemas.CMICreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar novo CMI"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Gerar número do contrato
    ano = datetime.now().year
    count = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id,
        func.extract('year', ContratoMediacaoImobiliaria.created_at) == ano
    ).count()
    numero = f"CMI-{ano}-{count + 1:04d}"
    
    # Obter dados do mediador
    dados_mediador = get_dados_mediador(current_user.agent_id, db)
    
    # Calcular data fim se não fornecida
    data_inicio = data.data_inicio or date.today()
    data_fim = data.data_fim
    if not data_fim and data.prazo_meses:
        data_fim = data_inicio + relativedelta(months=data.prazo_meses)
    
    # Criar CMI
    cmi = ContratoMediacaoImobiliaria(
        agent_id=current_user.agent_id,
        numero_contrato=numero,
        first_impression_id=data.first_impression_id,
        pre_angariacao_id=data.pre_angariacao_id,
        data_inicio=data_inicio,
        data_fim=data_fim,
        documentos_entregues=ContratoMediacaoImobiliaria.documentos_checklist(),
        **dados_mediador,
        **data.model_dump(exclude={'first_impression_id', 'pre_angariacao_id', 'data_inicio', 'data_fim'})
    )
    
    db.add(cmi)
    db.commit()
    db.refresh(cmi)
    
    logger.info(f"CMI criado: {numero} por agent_id={current_user.agent_id}")
    return cmi


@router.post("/from-first-impression", response_model=schemas.CMIResponse, status_code=201)
def criar_de_first_impression(
    data: schemas.CMICreateFromFirstImpression,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar CMI a partir de uma 1ª Impressão (pré-preenchido)"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    # Buscar 1ª Impressão
    fi = db.query(FirstImpression).filter(
        FirstImpression.id == data.first_impression_id,
        FirstImpression.agent_id == current_user.agent_id
    ).first()
    
    if not fi:
        raise HTTPException(status_code=404, detail="1ª Impressão não encontrada")
    
    # Verificar se já existe CMI para esta 1ª Impressão
    existing = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.first_impression_id == fi.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Já existe CMI ({existing.numero_contrato}) para esta 1ª Impressão"
        )
    
    # Gerar número
    ano = datetime.now().year
    count = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id,
        func.extract('year', ContratoMediacaoImobiliaria.created_at) == ano
    ).count()
    numero = f"CMI-{ano}-{count + 1:04d}"
    
    # Obter dados do mediador
    dados_mediador = get_dados_mediador(current_user.agent_id, db)
    
    # Data início e fim
    data_inicio = date.today()
    data_fim = data_inicio + relativedelta(months=6)
    
    # Criar CMI com dados da 1ª Impressão
    cmi = ContratoMediacaoImobiliaria(
        agent_id=current_user.agent_id,
        first_impression_id=fi.id,
        numero_contrato=numero,
        
        # Cliente (da 1ª Impressão)
        cliente_nome=fi.client_name,
        cliente_nif=fi.client_nif,
        cliente_telefone=fi.client_phone,
        cliente_email=fi.client_email,
        
        # Imóvel (da 1ª Impressão)
        imovel_morada=fi.location,
        imovel_freguesia=fi.freguesia,
        imovel_concelho=fi.concelho,
        imovel_distrito=fi.distrito,
        imovel_tipologia=fi.tipologia,
        imovel_artigo_matricial=fi.artigo_matricial,
        imovel_area_bruta=fi.area_bruta,
        imovel_area_util=fi.area_util,
        imovel_ano_construcao=fi.ano_construcao,
        imovel_estado_conservacao=fi.estado_conservacao,
        
        # Valores
        valor_pretendido=fi.valor_estimado,
        
        # Condições padrão
        tipo_contrato=TipoContrato.EXCLUSIVO,
        tipo_negocio="venda",
        comissao_percentagem=5.0,  # 5% padrão
        comissao_iva_incluido=False,
        prazo_meses=6,
        renovacao_automatica=True,
        data_inicio=data_inicio,
        data_fim=data_fim,
        
        # Checklist documentos
        documentos_entregues=ContratoMediacaoImobiliaria.documentos_checklist(),
        
        # Dados mediador
        **dados_mediador
    )
    
    db.add(cmi)
    db.commit()
    db.refresh(cmi)
    
    logger.info(f"CMI criado de 1ª Impressão: {numero}")
    return cmi


@router.put("/{cmi_id}", response_model=schemas.CMIResponse)
def atualizar_cmi(
    cmi_id: int,
    data: schemas.CMIUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Atualizar CMI"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    if item.status == CMIStatus.ASSINADO:
        raise HTTPException(status_code=400, detail="Não é possível editar um CMI já assinado")
    
    # Atualizar campos
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{cmi_id}")
def cancelar_cmi(
    cmi_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancelar CMI"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    item.status = CMIStatus.CANCELADO
    db.commit()
    
    return {"message": "CMI cancelado", "numero": item.numero_contrato}


@router.get("/by-first-impression/{first_impression_id}", response_model=schemas.CMIResponse)
def obter_por_first_impression(
    first_impression_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter CMI associado a uma 1ª Impressão (se existir)"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.first_impression_id == first_impression_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado para esta 1ª Impressão")
    
    return item


# =====================================================
# Assinaturas
# =====================================================

@router.post("/{cmi_id}/assinatura-cliente", response_model=schemas.CMIResponse)
def adicionar_assinatura_cliente(
    cmi_id: int,
    data: schemas.AssinaturaClienteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adicionar assinatura do cliente ao CMI"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    item.assinatura_cliente = data.assinatura
    item.assinatura_cliente_data = datetime.now()
    if data.local:
        item.local_assinatura = data.local
    
    # Verificar se ambas assinaturas estão presentes
    if item.assinatura_cliente and item.assinatura_mediador:
        item.status = CMIStatus.ASSINADO
    else:
        item.status = CMIStatus.PENDENTE_ASSINATURA
    
    db.commit()
    db.refresh(item)
    
    logger.info(f"Assinatura cliente adicionada ao CMI {item.numero_contrato}")
    return item


@router.post("/{cmi_id}/assinatura-mediador", response_model=schemas.CMIResponse)
def adicionar_assinatura_mediador(
    cmi_id: int,
    data: schemas.AssinaturaMediadorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Adicionar assinatura do mediador ao CMI"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    item.assinatura_mediador = data.assinatura
    item.assinatura_mediador_data = datetime.now()
    
    # Verificar se ambas assinaturas estão presentes
    if item.assinatura_cliente and item.assinatura_mediador:
        item.status = CMIStatus.ASSINADO
    else:
        item.status = CMIStatus.PENDENTE_ASSINATURA
    
    db.commit()
    db.refresh(item)
    
    logger.info(f"Assinatura mediador adicionada ao CMI {item.numero_contrato}")
    return item


# =====================================================
# OCR - Processar Documentos
# =====================================================

@router.post("/{cmi_id}/ocr", response_model=schemas.DocumentoOCRResponse)
def processar_documento_ocr(
    cmi_id: int,
    data: schemas.DocumentoOCRRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processar imagem de documento via OCR
    Extrai dados automaticamente de:
    - Cartão Cidadão (nome, NIF, data nascimento, validade)
    - Caderneta Predial (artigo, área, localização)
    - Certidão Permanente (descrição, ónus)
    
    NOTA: OCR simplificado - em produção usar serviço como:
    - Google Cloud Vision
    - Azure Computer Vision
    - Tesseract OCR
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    # Simular OCR (em produção, usar serviço real)
    # Por agora, retornar template de dados esperados
    dados_extraidos = {}
    confianca = 0.0
    mensagem = ""
    
    if data.tipo == "cc_frente":
        dados_extraidos = {
            "nome": "",
            "apelidos": "",
            "data_nascimento": "",
            "sexo": "",
            "numero_documento": "",
            "validade": "",
        }
        mensagem = "Posicione o CC na frente. Campos a extrair: Nome, Nº Documento, Validade"
        confianca = 0.85
        
    elif data.tipo == "cc_verso":
        dados_extraidos = {
            "nif": "",
            "nss": "",
            "nus": "",
        }
        mensagem = "Posicione o CC no verso. Campos a extrair: NIF, NSS, NUS"
        confianca = 0.90
        
    elif data.tipo == "caderneta_predial":
        dados_extraidos = {
            "artigo_matricial": "",
            "freguesia": "",
            "concelho": "",
            "distrito": "",
            "tipo_predio": "",
            "area_bruta": "",
            "area_terreno": "",
            "valor_patrimonial": "",
        }
        mensagem = "Caderneta Predial. Campos: Artigo, Localização, Áreas, Valor Patrimonial"
        confianca = 0.80
        
    elif data.tipo == "certidao_permanente":
        dados_extraidos = {
            "numero_descricao": "",
            "conservatoria": "",
            "proprietarios": [],
            "onus": [],
        }
        mensagem = "Certidão Permanente. Campos: Descrição, Conservatória, Proprietários, Ónus"
        confianca = 0.75
    
    # Guardar foto do documento
    fotos = item.documentos_fotos or []
    fotos.append({
        "tipo": data.tipo,
        "url": f"data:image/jpeg;base64,{data.imagem_base64[:50]}...",  # Truncar para não guardar tudo
        "dados_extraidos": dados_extraidos,
        "uploaded_at": datetime.now().isoformat()
    })
    item.documentos_fotos = fotos
    
    # Marcar documento como entregue
    docs = item.documentos_entregues or []
    tipo_map = {
        "cc_frente": "cc_proprietario",
        "cc_verso": "cc_proprietario",
        "caderneta_predial": "caderneta_predial",
        "certidao_permanente": "certidao_permanente",
    }
    doc_tipo = tipo_map.get(data.tipo)
    if doc_tipo:
        for doc in docs:
            if doc.get("tipo") == doc_tipo:
                doc["entregue"] = True
                doc["data"] = date.today().isoformat()
                break
    item.documentos_entregues = docs
    
    db.commit()
    
    return schemas.DocumentoOCRResponse(
        sucesso=True,
        tipo=data.tipo,
        dados_extraidos=dados_extraidos,
        confianca=confianca,
        mensagem=mensagem
    )


# =====================================================
# Marcar Documentos
# =====================================================

@router.put("/{cmi_id}/documentos/{doc_tipo}", response_model=schemas.CMIResponse)
def marcar_documento(
    cmi_id: int,
    doc_tipo: str,
    entregue: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marcar documento como entregue/não entregue"""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    docs = item.documentos_entregues or []
    found = False
    for doc in docs:
        if doc.get("tipo") == doc_tipo:
            doc["entregue"] = entregue
            doc["data"] = date.today().isoformat() if entregue else None
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=400, detail=f"Tipo de documento '{doc_tipo}' não encontrado")
    
    item.documentos_entregues = docs
    db.commit()
    db.refresh(item)
    
    return item
