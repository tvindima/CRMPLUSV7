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
from io import BytesIO
from fastapi.responses import StreamingResponse

from app.database import get_db
from app.security import get_current_user
from app.users.models import User
from app.models.contrato_mediacao import ContratoMediacaoImobiliaria, CMIStatus, TipoContrato
from app.models.first_impression import FirstImpression
from app.agents.models import Agent
from app.agencies.models import Agency
from app.schemas import contrato_mediacao as schemas

# OCR (Google Vision)
import base64
import os
import re
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
try:
    from google.cloud import vision  # type: ignore
    VISION_AVAILABLE = True
except Exception:
    VISION_AVAILABLE = False

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


@router.get("/{cmi_id}/pdf")
def gerar_pdf(
    cmi_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gerar PDF simples do CMI para pré-visualização/assinaturas."""
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 30*mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20*mm, y, f"Contrato de Mediação Imobiliária - {item.numero_contrato}")
    y -= 8*mm
    c.setFont("Helvetica", 11)
    c.drawString(20*mm, y, f"Data Início: {item.data_inicio}   Data Fim: {item.data_fim}")
    y -= 12*mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20*mm, y, "Cliente / Proprietário")
    y -= 7*mm
    c.setFont("Helvetica", 10)
    c.drawString(20*mm, y, f"Nome: {item.cliente_nome or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"NIF: {item.cliente_nif or ''}    CC: {item.cliente_cc or ''}   Validade: {item.cliente_cc_validade or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Telefone: {item.cliente_telefone or ''}   Email: {item.cliente_email or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Morada: {item.cliente_morada or ''}  {item.cliente_codigo_postal or ''} {item.cliente_localidade or ''}")
    y -= 10*mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20*mm, y, "Imóvel")
    y -= 7*mm
    c.setFont("Helvetica", 10)
    c.drawString(20*mm, y, f"Tipologia: {item.imovel_tipologia or ''}   Tipo: {item.imovel_tipo or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Morada: {item.imovel_morada or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Freguesia: {item.imovel_freguesia or ''}   Concelho: {item.imovel_concelho or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Artigo matricial: {item.imovel_artigo_matricial or ''}   Conservatória: {item.imovel_conservatoria or ''}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Áreas (bruta/útil): {item.imovel_area_bruta or ''} / {item.imovel_area_util or ''}")
    y -= 10*mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20*mm, y, "Condições do Contrato")
    y -= 7*mm
    c.setFont("Helvetica", 10)
    c.drawString(20*mm, y, f"Tipo: {item.tipo_contrato}   Valor pretendido: {format_money(item.valor_pretendido)}   Valor mínimo: {format_money(item.valor_minimo)}")
    y -= 6*mm
    c.drawString(20*mm, y, f"Comissão: {item.comissao_percentagem or ''}%   Prazo (meses): {item.prazo_meses or ''}")
    y -= 12*mm
    c.drawString(20*mm, y, "Assinaturas:")
    y -= 10*mm
    c.line(20*mm, y, 80*mm, y)
    c.drawString(22*mm, y-6, "Cliente / Proprietário")
    c.line(120*mm, y, 180*mm, y)
    c.drawString(122*mm, y-6, "Mediadora")
    c.showPage()
    c.save()
    buffer.seek(0)
    headers = {"Content-Disposition": f"inline; filename=cmi-{cmi_id}.pdf"}
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)


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
    
    def parse_cc_from_text(text: str):
        """Extrair campos básicos de CC a partir do texto OCR."""
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        surnames = None
        given = None
        doc_num = None
        validade = None
        # Procurar secções
        for idx, line in enumerate(lines):
            upper = line.upper()
            if "APELIDO" in upper and idx + 1 < len(lines):
                surnames = lines[idx + 1]
            if "NOME" in upper and idx + 1 < len(lines):
                given = lines[idx + 1]
            # Nº documento (8+ dígitos) ou padrão com letras (ex: ZX1)
            if not doc_num:
                m = re.search(r"\b(\d{6,}[A-Z0-9]*)\b", line.replace(" ", ""))
                if m:
                    doc_num = m.group(1)
            # Datas dd mm yyyy (última ocorrência como validade)
            for mdate in re.findall(r"\b(\d{2})[ /\-](\d{2})[ /\-](\d{4})\b", line):
                validade = f"{mdate[0]}/{mdate[1]}/{mdate[2]}"
        # fallback: apanhar primeiro número de 8-9 dígitos no texto completo
        if not doc_num:
            m = re.search(r"\b(\d{8,9})\b", text.replace(" ", ""))
            if m:
                doc_num = m.group(1)
        # Capturar validade mesmo que venha com pontos
        if not validade:
            mval = re.search(r"\b(\d{2})[.\-](\d{2})[.\-](\d{4})\b", text)
            if mval:
                validade = f"{mval.group(1)}/{mval.group(2)}/{mval.group(3)}"
        # Nome pela MRZ se existir
        name = None
        mrz_full = mrz_name(text)
        if given or surnames:
            name = " ".join([given or "", surnames or ""]).strip()
        if mrz_full:
            name = mrz_full
        return {"nome": name, "numero_documento": doc_num, "validade": validade}

    def parse_decimal(text_val: str):
        """Converter número com vírgula/espacos para Decimal."""
        try:
            cleaned = text_val.replace("€", "").replace(" ", "").replace(".", "").replace(",", ".")
            return Decimal(cleaned)
        except Exception:
            return None
    
    def format_money(val: Optional[Decimal]):
        if val is None:
            return ""
        return f"{val:,.2f}".replace(",", " ").replace(".", ",")
    
    def mrz_name(text: str):
        """
        Extrair nome/apelido a partir de MRZ (linha com <<).
        Formato: APELIDO<<NOME
        """
        for ln in text.splitlines():
            if "<<" in ln:
                parts = ln.strip().split("<<")
                last = parts[0].replace("<", " ").strip()
                first = parts[1].replace("<", " ").strip() if len(parts) > 1 else ""
                full = f"{first} {last}".strip()
                return full
        return None

    def parse_caderneta_from_text(text: str):
        """Extrair campos chave da caderneta predial."""
        data_out = {}
        # Artigo matricial
        m = re.search(r"ARTIGO\s+MATR[IÍ]CIAL[: ]+([A-Za-z0-9]+)", text, re.IGNORECASE)
        if m:
            data_out["artigo_matricial"] = m.group(1)
        # Distrito/Concelho/Freguesia
        md = re.search(r"DISTRITO[: ]+([A-Za-z0-9]+)", text, re.IGNORECASE)
        if md:
            data_out["distrito"] = md.group(1)
        mc = re.search(r"CONCELHO[: ]+([A-Za-z0-9]+)", text, re.IGNORECASE)
        if mc:
            data_out["concelho"] = mc.group(1)
        mf = re.search(r"FREGUESIA[: ]+([A-Za-z0-9]+)", text, re.IGNORECASE)
        if mf:
            data_out["freguesia"] = mf.group(1)
        # Morada / Código postal
        mcp = re.search(r"C[oó]digo\s+Postal[: ]+([\d\-]+)\s+([A-Za-z0-9 ]+)", text, re.IGNORECASE)
        if mcp:
            data_out["codigo_postal"] = mcp.group(1)
            data_out["localidade"] = mcp.group(2).strip()
        mrua = re.search(r"AV\.?/Rua/Prac[aà][: ]+([^\n]+)", text, re.IGNORECASE)
        if mrua:
            data_out["morada"] = mrua.group(1).strip()
        # Localidade se existir em campos de localização
        mloc = re.search(r"Localiza[cç][aã]o[: ]+([^\n]+)", text, re.IGNORECASE)
        if mloc and not data_out.get("morada"):
            data_out["morada"] = mloc.group(1).strip()
        # Tipologia
        mtipo = re.search(r"Tipologia/?Divis[oõ]es[: ]+([0-9]+)", text, re.IGNORECASE)
        if mtipo:
            data_out["tipologia"] = f"T{mtipo.group(1)}"
        # Áreas
        mt = re.search(r"[ÁA]rea\s+total\s+do\s+terreno[: ]+([\d\.,]+)", text, re.IGNORECASE)
        if mt:
            data_out["area_terreno"] = parse_decimal(mt.group(1))
        mcns = re.search(r"[ÁA]rea\s+de\s+constru[cç][aã]o[: ]+([\d\.,]+)", text, re.IGNORECASE)
        if mcns:
            data_out["area_bruta"] = parse_decimal(mcns.group(1))
        mup = re.search(r"[ÁA]rea\s+bruta\s+privativa[: ]+([\d\.,]+)", text, re.IGNORECASE)
        if mup:
            data_out["area_util"] = parse_decimal(mup.group(1))
        # Valor patrimonial
        mvp = re.search(r"Valor\s+patrimonial.*?:\s*€?\s*([\d\.,]+)", text, re.IGNORECASE)
        if mvp:
            data_out["valor_patrimonial"] = parse_decimal(mvp.group(1))
        # Área descoberta ou dependente pode ser ignorada para já
        return data_out

    def parse_certidao_from_text(text: str):
        """Extrair alguns campos da certidão permanente."""
        out = {}
        mat = re.search(r"MATRIZ\s*n[ºo]\s*[: ]+(\d+)", text, re.IGNORECASE)
        if mat:
            out["imovel_matriz_predial"] = mat.group(1)
        art = re.search(r"ARTIGO\s+MATR[IÍ]CIAL.*?(\d+)", text, re.IGNORECASE)
        if art:
            out["imovel_artigo_matricial"] = art.group(1)
        area_util = re.search(r"[ÁA]REA\s+ÚTIL\s+.*?([\d\.,]+)\s*m", text, re.IGNORECASE)
        if area_util:
            out["imovel_area_util"] = parse_decimal(area_util.group(1))
        area_bruta = re.search(r"[ÁA]REA\s+TOTAL.*?([\d\.,]+)\s*m", text, re.IGNORECASE)
        if area_bruta:
            out["imovel_area_bruta"] = parse_decimal(area_bruta.group(1))
        # Morada/Situado em
        mor = re.search(r"SITUAD[OA]\s+EM[: ]+([^\n]+)", text, re.IGNORECASE)
        if mor:
            out["imovel_morada"] = mor.group(1).strip()
        # Freguesia/Concelho se constarem na linha superior
        freg = re.search(r"FREGUESIA[: ]+([A-Za-z0-9 ]+)", text, re.IGNORECASE)
        if freg:
            out["imovel_freguesia"] = freg.group(1).strip()
        conc = re.search(r"CONSERVAT[ÓO]RIA.*?\sde\s+([A-Za-z0-9 ]+)", text, re.IGNORECASE)
        if conc:
            out["imovel_concelho"] = conc.group(1).strip()
        # Confrontações (simplificado: procurar "NORTE|SUL|NASCENTE|POENTE")
        confrontos = re.findall(r"(NORTE|SUL|NASCENTE|POENTE)[: ]+([^\n]+)", text, re.IGNORECASE)
        if confrontos:
            out["imovel_confrontacoes"] = "; ".join([f"{c[0]}: {c[1]}" for c in confrontos])
        # Descrição conservatória
        desc = re.search(r"descri[cç][aã]o.*?n[ºo]\s*([0-9]+)", text, re.IGNORECASE)
        if desc:
            out["imovel_descricao_conservatoria"] = desc.group(1)
        return out

    def parse_certificado_energetico(text: str):
        """Extrair morada, CP, freguesia/concelho, artigo e classe energética."""
        out = {}
        mor = re.search(r"Morada\s+([^\n]+)", text, re.IGNORECASE)
        if mor:
            out["imovel_morada"] = mor.group(1).strip()
        cp = re.search(r"[Cc][óo]digo\s+Postal\s+([0-9\\-]+)", text, re.IGNORECASE)
        if cp:
            out["imovel_codigo_postal"] = cp.group(1)
        freg = re.search(r"Freguesia\s+([A-Za-z0-9 ]+)", text, re.IGNORECASE)
        if freg:
            out["imovel_freguesia"] = freg.group(1).strip()
        conc = re.search(r"Concelho\s+([A-Za-z0-9 ]+)", text, re.IGNORECASE)
        if conc:
            out["imovel_concelho"] = conc.group(1).strip()
        art = re.search(r"Artigo\s+Matricial\s+n?[ºo]?\s*([A-Za-z0-9]+)", text, re.IGNORECASE)
        if art:
            out["imovel_artigo_matricial"] = art.group(1)
        area_util = re.search(r"[ÁA]rea\s+útil.*?([\d\.,]+)\s*m", text, re.IGNORECASE)
        if area_util:
            out["imovel_area_util"] = parse_decimal(area_util.group(1))
        classe = re.search(r"CLASSE\s+ENERG[ÉE]TICA.*?\b([A-F]\+?)\b", text, re.IGNORECASE)
        if classe:
            out["imovel_certificado_energetico"] = classe.group(1)
        # Nº certificado e validade
        num_cert = re.search(r"SCE\s*([0-9]{6,})", text, re.IGNORECASE)
        if num_cert:
            out["imovel_certificado_numero"] = num_cert.group(1)
        val = re.search(r"V[aá]lid[oa]\s+at[eé]\s*[: ]*(\d{2}[/-]\d{2}[/-]\d{4})", text, re.IGNORECASE)
        if val:
            out["imovel_certificado_validade"] = val.group(1)
        return out

    def parse_licenca_from_text(text: str):
        """Extrair nº e data da licença de utilização e município."""
        out = {}
        num = re.search(r"licen[cç]a\s+de\s+utiliza[cç][aã]o\s*n?[ºo]?\s*([A-Za-z0-9/\\-]+)", text, re.IGNORECASE)
        if num:
            out["imovel_licenca_numero"] = num.group(1)
        data = re.search(r"emitid[ao]\s+em\s+(\d{2}[/-]\d{2}[/-]\d{4})", text, re.IGNORECASE)
        if data:
            out["imovel_licenca_data"] = data.group(1)
        camara = re.search(r"C[âa]mara\s+Municipal\s+de\s+([A-Za-z ]+)", text, re.IGNORECASE)
        if camara:
            out["imovel_licenca_municipio"] = camara.group(1).strip()
        return out

    dados_extraidos = {}
    confianca = 0.0
    mensagem = ""

    # Aceita ambas variantes da env: GCP_VISION_ENABLED ou GCP_VISION_ENABLE
    vision_flag = os.environ.get("GCP_VISION_ENABLED") or os.environ.get("GCP_VISION_ENABLE") or "false"
    use_vision = vision_flag.lower() == "true" and VISION_AVAILABLE
    
    logger.info(f"[OCR] Vision flag: {vision_flag}, VISION_AVAILABLE: {VISION_AVAILABLE}, use_vision: {use_vision}")
    logger.info(f"[OCR] Tipo documento: {data.tipo}, imagem base64 length: {len(data.imagem_base64)}")

    if use_vision:
        try:
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=base64.b64decode(data.imagem_base64))
            response = client.text_detection(image=image)
            if response.error.message:
                raise RuntimeError(response.error.message)
            full_text = response.full_text_annotation.text if response.full_text_annotation else ""
            dados_extraidos = {"raw_text": full_text}
            confianca = 0.9
            mensagem = "Texto extraído com Google Vision"
        except Exception as e:
            logger.error(f"OCR Vision falhou: {e}")
            mensagem = "OCR Vision indisponível, retornando stub"
            dados_extraidos = {"raw_text": ""}
            confianca = 0.0
    # Stub (fallback)
    if not use_vision:
        logger.warning("[OCR] Google Vision não está ativo - retornando stub. Configure GCP_VISION_ENABLED=true no Railway.")
        if data.tipo == "cc_frente":
            dados_extraidos = dados_extraidos or {
                "nome": "",
                "apelidos": "",
                "data_nascimento": "",
                "sexo": "",
                "numero_documento": "",
                "validade": "",
            }
            mensagem = "⚠️ OCR automático não disponível. Configure GCP_VISION_ENABLED=true no Railway para ativar extração automática."
            confianca = 0.0
            
        elif data.tipo == "cc_verso":
            dados_extraidos = {
                "nif": "",
                "nss": "",
                "nus": "",
            }
            mensagem = "⚠️ OCR automático não disponível. Configure GCP_VISION_ENABLED=true no Railway."
            confianca = 0.0
            
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
            mensagem = "⚠️ OCR automático não disponível. Configure GCP_VISION_ENABLED=true no Railway."
            confianca = 0.0
            
        elif data.tipo == "certidao_permanente":
            dados_extraidos = {
                "numero_descricao": "",
                "conservatoria": "",
                "proprietarios": [],
                "onus": [],
            }
            mensagem = "⚠️ OCR automático não disponível. Configure GCP_VISION_ENABLED=true no Railway."
            confianca = 0.0
        else:
            # Tipo desconhecido
            mensagem = "⚠️ OCR automático não disponível. Configure GCP_VISION_ENABLED=true no Railway."
            confianca = 0.0
    
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

    # Aplicar preenchimento automático no CMI se conseguirmos extrair campos
    updates = {}
    if data.tipo in ("cc_frente", "cc_verso"):
        parsed = parse_cc_from_text(dados_extraidos.get("raw_text", "")) if "raw_text" in dados_extraidos else {}
        if parsed.get("nome"):
            updates["cliente_nome"] = parsed["nome"]
        if parsed.get("numero_documento"):
            updates["cliente_cc"] = parsed["numero_documento"]
        if parsed.get("validade"):
            updates["cliente_cc_validade"] = parsed["validade"]
        # Se o texto contiver um NIF, tentar extrair 9 dígitos
        nif_match = re.search(r"\b(\d{9})\b", dados_extraidos.get("raw_text", ""))
        if nif_match:
            updates["cliente_nif"] = nif_match.group(1)

    if data.tipo == "caderneta_predial":
        parsed_cad = parse_caderneta_from_text(dados_extraidos.get("raw_text", ""))
        if parsed_cad:
            if parsed_cad.get("artigo_matricial"):
                updates["imovel_artigo_matricial"] = parsed_cad["artigo_matricial"]
            if parsed_cad.get("freguesia"):
                updates["imovel_freguesia"] = parsed_cad["freguesia"]
            if parsed_cad.get("concelho"):
                updates["imovel_concelho"] = parsed_cad["concelho"]
            if parsed_cad.get("distrito"):
                updates["imovel_distrito"] = parsed_cad["distrito"]
            if parsed_cad.get("morada"):
                updates["imovel_morada"] = parsed_cad["morada"]
            if parsed_cad.get("codigo_postal"):
                updates["imovel_codigo_postal"] = parsed_cad["codigo_postal"]
            if parsed_cad.get("tipologia"):
                updates["imovel_tipologia"] = parsed_cad["tipologia"]
            if parsed_cad.get("area_bruta") is not None:
                updates["imovel_area_bruta"] = parsed_cad["area_bruta"]
            if parsed_cad.get("area_util") is not None:
                updates["imovel_area_util"] = parsed_cad["area_util"]
            if parsed_cad.get("valor_patrimonial") is not None:
                # Usar valor patrimonial como valor pretendido se estiver vazio
                if not item.valor_pretendido:
                    updates["valor_pretendido"] = parsed_cad["valor_patrimonial"]

    if data.tipo == "certidao_permanente":
        parsed_cert = parse_certidao_from_text(dados_extraidos.get("raw_text", ""))
        if parsed_cert:
            if parsed_cert.get("imovel_artigo_matricial"):
                updates["imovel_artigo_matricial"] = parsed_cert["imovel_artigo_matricial"]
            if parsed_cert.get("imovel_area_util") is not None:
                updates["imovel_area_util"] = parsed_cert["imovel_area_util"]
            if parsed_cert.get("imovel_area_bruta") is not None:
                updates["imovel_area_bruta"] = parsed_cert["imovel_area_bruta"]
            if parsed_cert.get("imovel_morada"):
                updates["imovel_morada"] = parsed_cert["imovel_morada"]
            if parsed_cert.get("imovel_freguesia"):
                updates["imovel_freguesia"] = parsed_cert["imovel_freguesia"]
            if parsed_cert.get("imovel_concelho"):
                updates["imovel_concelho"] = parsed_cert["imovel_concelho"]
            # Confrontações guardadas em notas
            if parsed_cert.get("imovel_confrontacoes"):
                if item.notas:
                    updates["notas"] = f"{item.notas}\nConfrontações: {parsed_cert['imovel_confrontacoes']}"
                else:
                    updates["notas"] = f"Confrontações: {parsed_cert['imovel_confrontacoes']}"
            if parsed_cert.get("imovel_descricao_conservatoria"):
                updates["imovel_descricao_conservatoria"] = parsed_cert["imovel_descricao_conservatoria"]

    if data.tipo == "certificado_energetico":
        parsed_ce = parse_certificado_energetico(dados_extraidos.get("raw_text", ""))
        if parsed_ce:
            for field in ["imovel_morada", "imovel_codigo_postal", "imovel_freguesia", "imovel_concelho", "imovel_artigo_matricial", "imovel_certificado_energetico"]:
                if parsed_ce.get(field):
                    updates[field] = parsed_ce[field]
            if parsed_ce.get("imovel_area_util") is not None:
                updates["imovel_area_util"] = parsed_ce["imovel_area_util"]
            if parsed_ce.get("imovel_certificado_numero"):
                updates["imovel_certificado_numero"] = parsed_ce["imovel_certificado_numero"]
            if parsed_ce.get("imovel_certificado_validade"):
                updates["imovel_certificado_validade"] = parsed_ce["imovel_certificado_validade"]
    if data.tipo == "licenca_utilizacao":
        parsed_li = parse_licenca_from_text(dados_extraidos.get("raw_text", ""))
        if parsed_li:
            for field in ["imovel_licenca_numero", "imovel_licenca_data", "imovel_licenca_municipio"]:
                if parsed_li.get(field):
                    updates[field] = parsed_li[field]

    # Persistir updates no CMI
    if updates:
        for field, value in updates.items():
            if value:
                setattr(item, field, value)

    db.commit()
    db.refresh(item)
    
    # Mapear os campos extraídos para o formato esperado pelo mobile
    # O mobile espera: nome, nif, numero_documento, artigo_matricial, area_bruta, etc.
    dados_para_mobile = {}
    
    if data.tipo in ("cc_frente", "cc_verso"):
        if updates.get("cliente_nome"):
            dados_para_mobile["nome"] = updates["cliente_nome"]
        if updates.get("cliente_nif"):
            dados_para_mobile["nif"] = updates["cliente_nif"]
        if updates.get("cliente_cc"):
            dados_para_mobile["numero_documento"] = updates["cliente_cc"]
        if updates.get("cliente_cc_validade"):
            dados_para_mobile["validade"] = updates["cliente_cc_validade"]
    
    elif data.tipo == "caderneta_predial":
        if updates.get("imovel_artigo_matricial"):
            dados_para_mobile["artigo_matricial"] = updates["imovel_artigo_matricial"]
        if updates.get("imovel_area_bruta"):
            dados_para_mobile["area_bruta"] = str(updates["imovel_area_bruta"])
        if updates.get("imovel_area_util"):
            dados_para_mobile["area_util"] = str(updates["imovel_area_util"])
        if updates.get("imovel_freguesia"):
            dados_para_mobile["freguesia"] = updates["imovel_freguesia"]
        if updates.get("imovel_concelho"):
            dados_para_mobile["concelho"] = updates["imovel_concelho"]
        if updates.get("imovel_distrito"):
            dados_para_mobile["distrito"] = updates["imovel_distrito"]
        if updates.get("imovel_morada"):
            dados_para_mobile["morada"] = updates["imovel_morada"]
        if updates.get("imovel_codigo_postal"):
            dados_para_mobile["codigo_postal"] = updates["imovel_codigo_postal"]
        if updates.get("valor_pretendido"):
            dados_para_mobile["valor_patrimonial"] = str(updates["valor_pretendido"])
    
    elif data.tipo == "certidao_permanente":
        if updates.get("imovel_artigo_matricial"):
            dados_para_mobile["artigo_matricial"] = updates["imovel_artigo_matricial"]
        if updates.get("imovel_area_bruta"):
            dados_para_mobile["area_bruta"] = str(updates["imovel_area_bruta"])
        if updates.get("imovel_area_util"):
            dados_para_mobile["area_util"] = str(updates["imovel_area_util"])
        if updates.get("imovel_morada"):
            dados_para_mobile["morada"] = updates["imovel_morada"]
        if updates.get("imovel_freguesia"):
            dados_para_mobile["freguesia"] = updates["imovel_freguesia"]
        if updates.get("imovel_concelho"):
            dados_para_mobile["concelho"] = updates["imovel_concelho"]
    
    elif data.tipo == "certificado_energetico":
        if updates.get("imovel_certificado_energetico"):
            dados_para_mobile["classe_energetica"] = updates["imovel_certificado_energetico"]
        if updates.get("imovel_morada"):
            dados_para_mobile["morada"] = updates["imovel_morada"]
        if updates.get("imovel_codigo_postal"):
            dados_para_mobile["codigo_postal"] = updates["imovel_codigo_postal"]
        if updates.get("imovel_area_util"):
            dados_para_mobile["area_util"] = str(updates["imovel_area_util"])
    
    elif data.tipo == "licenca_utilizacao":
        if updates.get("imovel_licenca_numero"):
            dados_para_mobile["licenca_numero"] = updates["imovel_licenca_numero"]
        if updates.get("imovel_licenca_data"):
            dados_para_mobile["licenca_data"] = updates["imovel_licenca_data"]
    
    # Se não extraiu nada, usar os dados originais (stub ou raw_text)
    if not dados_para_mobile:
        dados_para_mobile = dados_extraidos
    else:
        # Incluir raw_text também para debug se existir
        if dados_extraidos.get("raw_text"):
            dados_para_mobile["raw_text"] = dados_extraidos["raw_text"]
    
    # Ajustar confiança se extraímos dados reais
    if updates and confianca < 0.5:
        confianca = 0.7  # Confiança média se extraímos alguma coisa
    
    return schemas.DocumentoOCRResponse(
        sucesso=True,
        tipo=data.tipo,
        dados_extraidos=dados_para_mobile,
        confianca=confianca,
        mensagem=mensagem if mensagem else f"Extraídos {len(dados_para_mobile)} campos"
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
