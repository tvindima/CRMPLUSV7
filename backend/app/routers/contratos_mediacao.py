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
# Helper Functions
# =====================================================

def format_money(value) -> str:
    """Formatar valor monetário para exibição"""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):,.2f}€".replace(",", " ").replace(".", ",").replace(" ", ".")
    except (ValueError, TypeError):
        return str(value) if value else "N/A"


# =====================================================
# Dados do Mediador - AO LADO DO SUCESSO, LDA (FIXOS)
# =====================================================

# Dados oficiais da empresa mediadora (do modelo de contrato)
MEDIADORA_DADOS = {
    "mediador_nome": "AO LADO DO SUCESSO, LDA",
    "mediador_licenca_ami": "17195",
    "mediador_nif": "515 680 796",
    "mediador_morada": "Rua António da Silva Valverde, Lote 10, Loja Esq., Urb. das Pimenteiras",
    "mediador_codigo_postal": "2415-767 Leiria",
    "mediador_telefone": "",
    "mediador_email": "leiria@imoveismais.pt",
    "mediador_capital_social": "6.000,00",
    "mediador_conservatoria": "Conservatória de Leiria",
    "mediador_matricula": "515 680 796",
    # Seguro obrigatório
    "seguro_valor": "150.000,00",
    "seguro_apolice": "008365277",
    "seguro_companhia": "ZURICH",
}

def get_dados_mediador(agent_id: int, db: Session) -> dict:
    """Obter dados do mediador (fixos) e do agente responsável pela angariação"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    
    # Apenas os campos que existem no modelo ContratoMediacaoImobiliaria
    dados = {
        "mediador_nome": MEDIADORA_DADOS["mediador_nome"],
        "mediador_licenca_ami": MEDIADORA_DADOS["mediador_licenca_ami"],
        "mediador_nif": MEDIADORA_DADOS["mediador_nif"],
        "mediador_morada": MEDIADORA_DADOS["mediador_morada"],
        "mediador_codigo_postal": MEDIADORA_DADOS["mediador_codigo_postal"],
        "mediador_telefone": MEDIADORA_DADOS["mediador_telefone"],
        "mediador_email": MEDIADORA_DADOS["mediador_email"],
    }
    
    # Adicionar dados do agente (responsável pela angariação)
    if agent:
        dados["agente_nome"] = agent.name
        dados["agente_carteira_profissional"] = agent.license_ami or ""
    else:
        dados["agente_nome"] = ""
        dados["agente_carteira_profissional"] = ""
    
    return dados


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
    """Gerar PDF oficial do CMI seguindo o modelo legal português."""
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
    margin_left = 18*mm
    margin_right = width - 18*mm
    usable_width = margin_right - margin_left
    
    def safe(val):
        return str(val) if val else ""
    
    def checkbox(checked):
        return "■" if checked else "□"
    
    def draw_text(canvas_obj, text, x, y, max_width, font_size=9, leading=11):
        """Desenha texto com quebra de linha"""
        from reportlab.lib.utils import simpleSplit
        lines = simpleSplit(text, canvas_obj._fontname, font_size, max_width)
        for line in lines:
            canvas_obj.drawString(x, y, line)
            y -= leading
        return y
    
    # Detectar tipo de imóvel da descrição da Caderneta
    tipo_imovel = safe(item.imovel_tipo)
    if not tipo_imovel:
        # Tentar detectar da tipologia ou área
        if item.imovel_area_terreno and float(item.imovel_area_terreno or 0) > 500:
            tipo_imovel = "Moradia"
        elif item.imovel_tipologia:
            tipo_imovel = "Habitação"
        else:
            tipo_imovel = "Habitação"
    
    # =====================================================
    # PÁGINA 1 - CABEÇALHO + PARTES + CLÁUSULAS 1-9
    # =====================================================
    y = height - 18*mm
    
    # Cabeçalho
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(margin_right, y, f"Contrato n.º {item.numero_contrato}")
    y -= 10*mm
    
    # Título
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(width/2, y, "CONTRATO DE MEDIAÇÃO IMOBILIÁRIA")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    c.drawCentredString(width/2, y, "(Nos termos da Lei n.º 15/2013, de 08 de Fevereiro)")
    y -= 4*mm
    c.setFont("Helvetica-Bold", 10)
    # Tipo de negócio no título
    if item.tipo_negocio == "venda":
        titulo_neg = "COMPRA/OUTROS"
    elif item.tipo_negocio == "arrendamento":
        titulo_neg = "ARRENDAMENTO"
    else:
        titulo_neg = "COMPRA/OUTROS"
    c.drawCentredString(width/2, y, titulo_neg)
    y -= 8*mm
    
    # Entre - MEDIADORA (dados fixos)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin_left, y, "Entre:")
    y -= 4*mm
    c.setFont("Helvetica", 8)
    med = f"{MEDIADORA_DADOS['mediador_nome']}, com sede social na {MEDIADORA_DADOS['mediador_morada']}, "
    med += f"{MEDIADORA_DADOS['mediador_codigo_postal']}, com o capital social de {MEDIADORA_DADOS['mediador_capital_social']} euros "
    med += f"e com o NIPC n.º {MEDIADORA_DADOS['mediador_nif']}, matriculada na {MEDIADORA_DADOS['mediador_conservatoria']}, "
    med += f"detentora da Licença AMI n.º {MEDIADORA_DADOS['mediador_licenca_ami']}, emitida pelo Instituto de Construção e "
    med += "do Imobiliário (INCI), adiante designada como "
    y = draw_text(c, med, margin_left, y, usable_width, 8, 10)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin_left, y, "Mediadora.")
    y -= 5*mm
    
    # E - CLIENTE (Segundo Contratante)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin_left, y, "E")
    y -= 4*mm
    c.setFont("Helvetica", 8)
    cli = f"(nome do cliente) {safe(item.cliente_nome)}, (estado civil) {safe(item.cliente_estado_civil) or '_______'}, "
    cli += f"sob o regime de bens _____________, com (cônjuge) _____________, "
    cli += f"residente(s) em {safe(item.cliente_morada) or '_______________________________'}, "
    cli += f"código postal: {safe(item.cliente_codigo_postal) or '____-___'}, "
    cli += f"portador(es) do(s) B.I./CC nº(s) {safe(item.cliente_cc) or '___________'}, "
    cli += f"válidos até {safe(item.cliente_cc_validade) or '__/__/____'}, "
    cli += f"e contribuinte(s) fiscal(is) n.º(s) {safe(item.cliente_nif) or '_________'}, "
    cli += f"com telemóvel nº {safe(item.cliente_telefone) or '___________'} "
    cli += f"e email {safe(item.cliente_email) or '_________________'}, adiante designado(s) como "
    y = draw_text(c, cli, margin_left, y, usable_width, 8, 10)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin_left, y, "Segundo(s) Contratante(s)")
    c.setFont("Helvetica", 8)
    c.drawString(margin_left + 38*mm, y, " na qualidade de Proprietário, é celebrado o presente ")
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin_left + 115*mm, y, "Contrato de Mediação")
    y -= 3*mm
    c.drawString(margin_left, y, "Imobiliária")
    c.setFont("Helvetica", 8)
    c.drawString(margin_left + 18*mm, y, " que se rege pelas seguintes cláusulas:")
    y -= 7*mm
    
    # CLÁUSULA 1 - Identificação do Imóvel
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 1.ª - (Identificação do Imóvel)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    im = f"O Segundo Contratante é proprietário e legítimo possuidor da fracção autónoma/prédio(rústico/urbano)/"
    im += f"estabelecimento comercial, destinado(a) a {tipo_imovel}, sendo constituído por "
    im += f"{safe(item.imovel_tipologia) or '___'} divisões assoalhadas, com uma área total de "
    im += f"{safe(item.imovel_area_bruta) or '___'} m², sito na(Rua,Av.,Etc.) {safe(item.imovel_morada) or '______________'}, "
    im += f"concelho de {safe(item.imovel_concelho) or '__________'}, código postal {safe(item.imovel_codigo_postal) or '____-___'}, "
    im += f"descrito na Conservatória do Registo Predial de {safe(item.imovel_conservatoria) or '__________'}, "
    im += f"sob a descrição n.º {safe(item.imovel_numero_descricao) or '________'}, "
    im += f"inscrito na matriz predial (urbana/rústica) com o artigo n.º {safe(item.imovel_artigo_matricial) or '____'} "
    im += f"da freguesia de {safe(item.imovel_freguesia) or '__________'}, "
    im += f"e certificado energético nº {safe(item.imovel_certificado_energetico) or '___________'} válido até ___________."
    y = draw_text(c, im, margin_left, y, usable_width, 8, 10)
    y -= 5*mm
    
    # CLÁUSULA 2 - Identificação do Negócio (checkboxes dinâmicos)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 2.ª - (Identificação do Negócio)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    # Checkboxes baseados no tipo_negocio
    cb_compra = checkbox(item.tipo_negocio == "venda")
    cb_arrend = checkbox(item.tipo_negocio == "arrendamento")
    cb_tresp = checkbox(item.tipo_negocio == "trespasse")
    neg = f"1 – A Mediadora obriga-se a diligenciar no sentido de conseguir interessado na  {cb_compra} Compra  "
    neg += f"{cb_arrend} Arrendamento  {cb_tresp} Trespasse  pelo preço de {format_money(item.valor_pretendido)} "
    neg += f"({format_money(item.valor_pretendido)} Euros), desenvolvendo para o efeito, ações de promoção e recolha de "
    neg += "informações sobre os negócios pretendidos e características dos respetivos imóveis."
    y = draw_text(c, neg, margin_left, y, usable_width, 8, 10)
    y -= 2*mm
    c.drawString(margin_left, y, "2 – Qualquer alteração ao preço fixado no número anterior deverá ser comunicada de imediato e por escrito à Mediadora.")
    y -= 5*mm
    
    # CLÁUSULA 3 - Ónus e Encargos (checkboxes dinâmicos)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 3.ª - (Ónus e Encargos)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    livre_onus = getattr(item, 'imovel_livre_onus', True) if hasattr(item, 'imovel_livre_onus') else True
    cb_livre = checkbox(livre_onus)
    cb_onus = checkbox(not livre_onus)
    c.drawString(margin_left, y, f"{cb_livre} O imóvel encontra-se livre de quaisquer ónus ou encargos.")
    y -= 3*mm
    onus_desc = getattr(item, 'imovel_onus_descricao', '') or '________________'
    onus_val = getattr(item, 'imovel_onus_valor', '') or '________________'
    c.drawString(margin_left, y, f"{cb_onus} O Segundo Contratante declara que sobre o imóvel descrito recaem os seguintes ónus e encargos")
    y -= 3*mm
    c.drawString(margin_left, y, f"   (hipotecas e penhoras) {onus_desc}, pelo valor de {onus_val} Euros.")
    y -= 5*mm
    
    # CLÁUSULA 4 - Regime de Contratação
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 4.ª - (Regime de Contratação)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    is_exclusivo = item.tipo_contrato == TipoContrato.EXCLUSIVO
    c.drawString(margin_left, y, f"1 – Os Segundos Contratantes contratam a Mediadora em regime de {'Exclusividade' if is_exclusivo else 'Não Exclusividade'}.")
    y -= 3*mm
    reg = "2 – Nos termos da legislação aplicável, quando o contrato é celebrado em regime de exclusividade só a Mediadora "
    reg += "contratada tem o direito de promover o negócio objeto do contrato de mediação durante o respetivo período de "
    reg += "vigência, ficando a segunda Contratante obrigada a pagar a comissão acordada caso viole a obrigação de exclusividade."
    y = draw_text(c, reg, margin_left, y, usable_width, 8, 10)
    y -= 5*mm
    
    # CLÁUSULA 5 - Remuneração (checkboxes dinâmicos para opção de pagamento)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 5.ª - (Remuneração)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    rem = "1 – A remuneração da Mediadora só é devida se esta conseguir interessado que concretize o negócio visado pelo "
    rem += "presente contrato, nos termos do art. 19º da Lei 15/2013 de 08 de Fevereiro."
    y = draw_text(c, rem, margin_left, y, usable_width, 8, 10)
    y -= 2*mm
    c.drawString(margin_left, y, "2 – O segundo contratante obriga-se a pagar à Mediadora, sobre o preço de venda do imóvel:")
    y -= 3*mm
    comissao = safe(item.comissao_percentagem) or "5"
    c.drawString(margin_left, y, f"   ■ {comissao}% (acrescido de IVA à taxa legal em vigor, se o negócio for superior a €100.000,00)")
    y -= 3*mm
    c.drawString(margin_left, y, "   ■ €4.000,00 (acrescido de IVA à taxa legal em vigor, se o negócio for igual ou inferior a €100.000,00)")
    y -= 3*mm
    # Opção de pagamento (checkboxes dinâmicos)
    opcao_pag = getattr(item, 'opcao_pagamento', 'cpcv') or 'cpcv'
    cb_cpcv = checkbox(opcao_pag == 'cpcv')
    cb_escr = checkbox(opcao_pag == 'escritura')
    cb_fase = checkbox(opcao_pag == 'faseado')
    pag_perc_cpcv = getattr(item, 'pagamento_percentagem_cpcv', 50) or 50
    pag_perc_escr = getattr(item, 'pagamento_percentagem_escritura', 50) or 50
    c.drawString(margin_left, y, f"3 – Condições de pagamento: {cb_cpcv} Total aquando CPCV  {cb_escr} Na escritura  {cb_fase} Faseado {pag_perc_cpcv}%/{pag_perc_escr}%")
    y -= 3*mm
    c.drawString(margin_left, y, "4 – O direito à remuneração não é afastado pelo exercício de preferência legal sobre o imóvel.")
    y -= 3*mm
    rem5 = "5 – A comissão é devida se o imóvel for vendido por terceiros estranhos ao contrato (em regime de exclusividade)."
    y = draw_text(c, rem5, margin_left, y, usable_width, 8, 10)
    y -= 2*mm
    rem6 = "6 – Se o interessado indicado concluir o negócio visado até 6 meses após término deste contrato, a comissão é devida."
    y = draw_text(c, rem6, margin_left, y, usable_width, 8, 10)
    y -= 5*mm
    
    # CLÁUSULA 6 - Garantias
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 6.ª - (Garantias da Atividade de Mediação)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    gar = "A Mediadora, nos termos do art. 7.º da Lei 15/2013, de 8 de Fevereiro, tem seguro de responsabilidade civil "
    gar += "com capital mínimo de €150.000,00 por sinistro, com apólice nº 008365277, da seguradora ZURICH, Portugal."
    y = draw_text(c, gar, margin_left, y, usable_width, 8, 10)
    y -= 5*mm
    
    # CLÁUSULA 7 - Prazo
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 7.ª - (Prazo de Duração do Contrato)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    prazo = safe(item.prazo_meses) or "6"
    praz = f"1 – O presente contrato tem a validade de {prazo} meses, renovando-se automaticamente por iguais períodos, caso "
    praz += "não seja denunciado nos termos previstos neste contrato."
    y = draw_text(c, praz, margin_left, y, usable_width, 8, 10)
    y -= 2*mm
    c.drawString(margin_left, y, "2 – O contrato pode ser denunciado por qualquer das partes com 10 dias de antecedência, por carta registada.")
    y -= 5*mm
    
    # CLÁUSULA 8 - Colaboração
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 8.ª - (Dever de Colaboração)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    c.drawString(margin_left, y, "1 – O Contratante obriga-se a entregar à Mediadora todos os documentos necessários no prazo de 10 dias úteis.")
    y -= 3*mm
    c.drawString(margin_left, y, "2 – O Contratante facilitará as visitas ao imóvel pelos interessados, a pedido da Mediadora.")
    y -= 5*mm
    
    # CLÁUSULA 9 - Angariador (dados do agente)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 9.ª - (Angariador Imobiliário)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    ag = f"Na preparação e elaboração do presente contrato colaborou {safe(item.agente_nome) or '________________'}, "
    ag += f"contribuinte nº {safe(item.agente_nif) or safe(item.agente_carteira_profissional) or '________________'}, "
    ag += "angariador(a) imobiliário(a) da Mediadora."
    y = draw_text(c, ag, margin_left, y, usable_width, 8, 10)
    
    c.showPage()
    
    # =====================================================
    # PÁGINA 2 - CLÁUSULAS 10-12 (RGPD) + ASSINATURAS
    # =====================================================
    y = height - 18*mm
    
    # CLÁUSULA 10 - Foro
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 10.ª - (Foro Competente)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    foro = "Para resolução de todos os litígios emergentes do presente contrato, as partes acordam a competência do Foro "
    foro += "da Comarca de Leiria, com expressa renúncia a qualquer outro. (Cláusula facultativa)"
    y = draw_text(c, foro, margin_left, y, usable_width, 8, 10)
    y -= 5*mm
    
    # CLÁUSULA 11 - Litígios Consumo
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 11.ª - (Competência para dirimir litígios de consumo)")
    y -= 5*mm
    c.setFont("Helvetica", 8)
    lit = "1 – Em caso de litígio de consumo nos termos da Lei 144/2015 de 8 de Setembro, o consumidor pode recorrer "
    lit += "à entidade de resolução alternativa de litígios de consumo competente. "
    lit += "2 – Considera-se competente a entidade de resolução alternativa de litígios de consumo do local de celebração do contrato. "
    lit += "3 – Caso não exista, recorrer ao CNIACC (cniacc@uni.pt, www.arbitragemdeconsumo.org)."
    y = draw_text(c, lit, margin_left, y, usable_width, 8, 10)
    y -= 6*mm
    
    # CLÁUSULA 12 - RGPD
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width/2, y, "Cláusula 12.ª - (Tratamento de dados – RGPD)")
    y -= 5*mm
    c.setFont("Helvetica", 7)
    
    med_nome = MEDIADORA_DADOS['mediador_nome']
    med_email = MEDIADORA_DADOS['mediador_email']
    med_morada = MEDIADORA_DADOS['mediador_morada']
    rgpd = [
        f"1. Os dados pessoais recolhidos por {med_nome} destinam-se exclusivamente à gestão da relação contratual e prestação de serviços de mediação imobiliária.",
        "2. São solicitados: nome completo, estado civil, NIF, morada, identificação civil, contactos, e documentos do imóvel (caderneta predial, certidão permanente, CE, etc.).",
        f"3. Todos os dados solicitados são indispensáveis à execução do presente contrato e ao cumprimento das obrigações legais.",
        f"4. {med_nome} pode recorrer a subcontratantes (contabilidade, jurídico, informática) com garantias de confidencialidade e cumprimento do RGPD.",
        f"5. Transferências internacionais de dados só serão realizadas para países com decisão de adequação ou mediante consentimento expresso.",
        "6. Os dados pessoais não serão utilizados para outras finalidades sem o seu consentimento prévio e expresso.",
        "7. Os dados serão conservados pelo período mínimo legalmente exigido para o cumprimento das obrigações contratuais e legais.",
        f"8. Está garantido o direito de acesso, retificação, apagamento, oposição, limitação e portabilidade dos seus dados pessoais.",
        f"9. Para exercer os seus direitos, contactar via email {med_email} ou por escrito para {med_morada}.",
        f"10. Reclamações podem ser apresentadas à {med_nome} ou à Comissão Nacional de Proteção de Dados (CNPD).",
    ]
    
    for r in rgpd:
        y = draw_text(c, r, margin_left, y, usable_width, 7, 9)
        y -= 1*mm
    
    y -= 8*mm
    
    # TEXTO FINAL
    c.setFont("Helvetica", 9)
    c.drawString(margin_left, y, "Depois de lido e ratificado, as partes comprometem-se a cumprir este contrato segundo os ditames da boa-fé.")
    y -= 6*mm
    c.drawString(margin_left, y, "Feito em duplicado, destinando-se um exemplar a cada uma das partes intervenientes.")
    y -= 8*mm
    
    # Data e local
    from datetime import datetime
    if item.data_inicio:
        dia = item.data_inicio.day
        mes = item.data_inicio.month
        ano = item.data_inicio.year
        meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                 "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        data_str = f"{dia} de {meses[mes]} de {ano}"
    else:
        now = datetime.now()
        meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                 "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        data_str = f"{now.day} de {meses[now.month]} de {now.year}"
    
    local = safe(item.local_assinatura) or "Leiria"
    c.drawString(margin_left, y, f"{local}, {data_str}.")
    y -= 20*mm
    
    # Assinaturas
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(55*mm, y, "A MEDIADORA")
    c.drawCentredString(155*mm, y, "O SEGUNDO CONTRATANTE")
    y -= 15*mm
    
    # Linhas para assinatura
    c.line(20*mm, y, 90*mm, y)
    c.line(120*mm, y, 190*mm, y)
    
    # Nomes sob as linhas
    y -= 5*mm
    c.setFont("Helvetica", 8)
    c.drawCentredString(55*mm, y, f"({MEDIADORA_DADOS['mediador_nome']})")
    c.drawCentredString(155*mm, y, f"({safe(item.cliente_nome) or 'Nome do Cliente'})")
    
    # Assinaturas digitais se existirem
    if item.assinatura_mediador:
        try:
            from reportlab.lib.utils import ImageReader
            img_data = base64.b64decode(item.assinatura_mediador.split(',')[1] if ',' in item.assinatura_mediador else item.assinatura_mediador)
            img = ImageReader(BytesIO(img_data))
            c.drawImage(img, 30*mm, y+3*mm, width=50*mm, height=18*mm, preserveAspectRatio=True, mask='auto')
        except:
            pass
    
    if item.assinatura_cliente:
        try:
            from reportlab.lib.utils import ImageReader
            img_data = base64.b64decode(item.assinatura_cliente.split(',')[1] if ',' in item.assinatura_cliente else item.assinatura_cliente)
            img = ImageReader(BytesIO(img_data))
            c.drawImage(img, 130*mm, y+3*mm, width=50*mm, height=18*mm, preserveAspectRatio=True, mask='auto')
        except:
            pass
    
    c.save()
    buffer.seek(0)
    headers = {"Content-Disposition": f"inline; filename=cmi-{item.numero_contrato}.pdf"}
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
# OCR - Processar Documentos (Metodologia Âncoras)
# =====================================================

# ========== CLASSIFICADORES DE DOCUMENTO ==========

def classificar_documento(text: str) -> str:
    """
    PASSO ZERO: Classificar tipo de documento por âncoras determinísticas.
    Nunca misturar lógica entre tipos.
    
    ORDEM DE PRIORIDADE (mais específico primeiro):
    1. Caderneta Predial (âncoras muito específicas)
    2. Certidão Permanente (âncoras específicas)
    3. Certificado Energético
    4. Licença de Utilização
    5. Cartão de Cidadão (último porque é menos específico)
    """
    text_upper = text.upper()
    
    # 1. CADERNETA PREDIAL - âncoras muito específicas (verificar primeiro!)
    if ("CADERNETA PREDIAL" in text_upper or 
        "AUTORIDADE TRIBUTÁRIA" in text_upper or
        "ARTIGO MATRICIAL" in text_upper or
        "SERVIÇO DE FINANÇAS" in text_upper or
        "VALOR PATRIMONIAL" in text_upper):
        logger.info("[CLASSIFICADOR] Detectado: caderneta_predial")
        return "caderneta_predial"
    
    # 2. CERTIDÃO PERMANENTE / Registo Predial
    if ("REGISTO PREDIAL" in text_upper or 
        "INFORMAÇÃO PREDIAL" in text_upper or
        "CONSERVATÓRIA" in text_upper or 
        "SUJEITO ATIVO" in text_upper or
        "SUJEITOS ATIVOS" in text_upper):
        logger.info("[CLASSIFICADOR] Detectado: certidao_permanente")
        return "certidao_permanente"
    
    # 3. CERTIFICADO ENERGÉTICO - ADENE
    if ("CERTIFICADO ENERG" in text_upper or 
        "ADENE" in text_upper or 
        "CLASSE ENERG" in text_upper or 
        "DESEMPENHO ENERG" in text_upper):
        logger.info("[CLASSIFICADOR] Detectado: certificado_energetico")
        return "certificado_energetico"
    
    # 4. LICENÇA DE UTILIZAÇÃO
    if ("LICENÇA DE UTILIZAÇÃO" in text_upper or 
        ("CÂMARA MUNICIPAL" in text_upper and "UTILIZAÇÃO" in text_upper)):
        logger.info("[CLASSIFICADOR] Detectado: licenca_utilizacao")
        return "licenca_utilizacao"
    
    # 5. CARTÃO DE CIDADÃO - verificar por último (menos específico)
    if "CARTÃO DE CIDADÃO" in text_upper or "CITIZEN CARD" in text_upper:
        # Distinguir frente vs verso
        if "FILIAÇÃO" in text_upper or "PARENTS" in text_upper:
            logger.info("[CLASSIFICADOR] Detectado: cc_verso (tem FILIAÇÃO)")
            return "cc_verso"
        if "APELIDO" in text_upper or "SURNAME" in text_upper:
            logger.info("[CLASSIFICADOR] Detectado: cc_frente (tem APELIDO)")
            return "cc_frente"
        # Fallback: verificar MRZ
        if "<<" in text:
            logger.info("[CLASSIFICADOR] Detectado: cc_verso (tem MRZ)")
            return "cc_verso"
        logger.info("[CLASSIFICADOR] Detectado: cc_frente (default)")
        return "cc_frente"
    
    # Fallback: Se tiver MRZ mas não tiver "CARTÃO DE CIDADÃO", provavelmente é CC
    if "<<" in text and text.count("<") > 5:
        logger.info("[CLASSIFICADOR] Detectado: cc_verso (MRZ sem label CC)")
        return "cc_verso"
    
    logger.warning("[CLASSIFICADOR] Tipo desconhecido")
    return "desconhecido"


# ========== EXTRATOR: CARTÃO DE CIDADÃO ==========

def extrair_cc(text: str) -> dict:
    """
    Extrator dedicado para Cartão de Cidadão Português.
    
    REGRAS:
    - Nome legal vem SEMPRE da MRZ (linha com <<)
    - Datas vêm da MRZ (linha numérica com 6 dígitos + M/F)
    - Número documento: 8-9 dígitos + ZX/ZY sufixo
    - NIF: Extrair se visível (campo "TAX No" ou "FISCAL")
    
    MRZ do CC Português:
    - Linha 1: I<PRT092207960<ZX16<<<<<<<<<< (tipo + país + nº doc)
    - Linha 2: 6104243F3011249PRT<<<<<<<<<<<6 (nascimento + sexo + validade + país)
    - Linha 3: SOARES<VINDIMA<FERREIRA<<ROSA< (apelidos<<nomes)
    """
    logger.info("[OCR CC] Iniciando extração robusta")
    
    result = {
        "nome_completo": None,
        "numero_documento": None,
        "data_nascimento": None,
        "data_validade": None,
        "nif": None,  # Extrair se visível no CC
        "nacionalidade": None,
        "sexo": None,
    }
    
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    text_clean = text.replace(" ", "")
    
    # ===== 1. NOME VIA MRZ =====
    # Linha com APELIDO<<NOME (só letras e <)
    for line in lines:
        clean_line = line.replace(" ", "")
        # MRZ de nome: só letras maiúsculas e <, tem <<
        if "<<" in clean_line and re.match(r'^[A-Z<]+$', clean_line):
            parts = clean_line.split("<<")
            if len(parts) >= 2:
                apelidos = parts[0].replace("<", " ").strip()
                nomes = parts[1].replace("<", " ").strip()
                if apelidos and nomes and len(apelidos) > 2:
                    result["nome_completo"] = f"{nomes} {apelidos}".title()
                    logger.info(f"[OCR CC] ✅ Nome MRZ: {result['nome_completo']}")
                    break
    
    # ===== 2. DADOS DA MRZ (linha com data nascimento) =====
    # Procurar linha que tem padrão: AAMMDD + M/F + AAMMDD (nascimento + sexo + validade)
    for line in lines:
        clean_line = line.replace(" ", "")
        # Padrão: 6 dígitos + M ou F + 6 dígitos
        mrz_data = re.search(r'(\d{6})([MF])(\d{6})', clean_line)
        if mrz_data:
            # Data nascimento: AAMMDD
            nasc = mrz_data.group(1)
            ano_n = nasc[0:2]
            mes_n = nasc[2:4]
            dia_n = nasc[4:6]
            # Anos: 00-30 = 2000s, 31-99 = 1900s
            ano_n_full = f"19{ano_n}" if int(ano_n) > 30 else f"20{ano_n}"
            result["data_nascimento"] = f"{dia_n}/{mes_n}/{ano_n_full}"
            logger.info(f"[OCR CC] ✅ Nascimento MRZ: {result['data_nascimento']}")
            
            # Sexo
            result["sexo"] = mrz_data.group(2)
            
            # Data validade: AAMMDD
            val = mrz_data.group(3)
            ano_v = val[0:2]
            mes_v = val[2:4]
            dia_v = val[4:6]
            ano_v_full = f"20{ano_v}"  # Validade sempre 20xx
            result["data_validade"] = f"{dia_v}/{mes_v}/{ano_v_full}"
            logger.info(f"[OCR CC] ✅ Validade MRZ: {result['data_validade']}")
            
            # Nacionalidade (logo após validade)
            nac_match = re.search(r'PRT|[A-Z]{3}', clean_line[mrz_data.end():])
            if nac_match:
                result["nacionalidade"] = nac_match.group(0)
            break
    
    # ===== 3. NÚMERO DO DOCUMENTO =====
    # Formato: 09220796 0 ZX1 ou na MRZ: I<PRT092207960<ZX16
    
    # Tentar da MRZ primeiro (mais fiável)
    mrz_doc = re.search(r'I<PRT(\d{9})<([A-Z]{2}\d+)', text_clean)
    if mrz_doc:
        result["numero_documento"] = f"{mrz_doc.group(1)} {mrz_doc.group(2)}"
        logger.info(f"[OCR CC] ✅ Nº doc MRZ: {result['numero_documento']}")
    else:
        # Fallback: procurar 8-9 dígitos seguidos de ZX/ZY
        doc_match = re.search(r'(\d{8,9})\s*\d?\s*([A-Z]{2}\d+)', text)
        if doc_match:
            result["numero_documento"] = f"{doc_match.group(1)} {doc_match.group(2)}"
            logger.info(f"[OCR CC] ✅ Nº doc texto: {result['numero_documento']}")
    
    # ===== 4. NIF (se visível no CC) =====
    # Procurar após "TAX No", "FISCAL", "NIF"
    nif_patterns = [
        r'TAX\s*N[°ºo]?\s*[:\s]*(\d{9})',
        r'FISCAL\s*[:\s]*(\d{9})',
        r'NIF\s*[:\s]*(\d{9})',
        r'(?:ÇÃO|CAO)\s+FISCAL[^0-9]*(\d{9})',  # "CAÇÃO FISCAL" do OCR
    ]
    for pattern in nif_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            result["nif"] = m.group(1)
            logger.info(f"[OCR CC] ✅ NIF encontrado: {result['nif']}")
            break
    
    # Fallback NIF: Procurar 9 dígitos após certas palavras-chave
    if not result["nif"]:
        # Procurar linhas com números de 9 dígitos
        for i, line in enumerate(lines):
            if any(kw in line.upper() for kw in ["TAX", "FISCAL", "NIF"]):
                # Procurar na mesma linha ou próxima
                search_text = line + " " + (lines[i+1] if i+1 < len(lines) else "")
                nif_match = re.search(r'\b(\d{9})\b', search_text)
                if nif_match:
                    result["nif"] = nif_match.group(1)
                    logger.info(f"[OCR CC] ✅ NIF contexto: {result['nif']}")
                    break
    
    # ===== 5. FALLBACK: Datas do texto =====
    if not result["data_validade"]:
        dates = re.findall(r'\b(\d{2})[/\-.\s](\d{2})[/\-.\s](\d{4})\b', text)
        if dates:
            d = dates[-1]
            result["data_validade"] = f"{d[0]}/{d[1]}/{d[2]}"
            if len(dates) >= 2:
                d0 = dates[0]
                result["data_nascimento"] = f"{d0[0]}/{d0[1]}/{d0[2]}"
            logger.info(f"[OCR CC] Datas fallback: nasc={result['data_nascimento']}, val={result['data_validade']}")
    
    logger.info(f"[OCR CC] Resultado final: {result}")
    return result


# ========== EXTRATOR: CADERNETA PREDIAL (AT) ==========

def extrair_caderneta(text: str) -> dict:
    """
    Extrator dedicado para Caderneta Predial Urbana/Rústica.
    FONTE FISCAL do imóvel e NIF do titular.
    """
    logger.info("[OCR CADERNETA] Iniciando extração por âncoras")
    
    result = {
        # Dados do imóvel
        "artigo_matricial": None,
        "natureza": None,  # URBANO/RÚSTICO
        "tipo_imovel": None,  # Moradia/Apartamento/Terreno/etc.
        "distrito": None,
        "concelho": None,
        "freguesia": None,
        "morada": None,
        "codigo_postal": None,
        "localidade": None,
        "area_total_terreno": None,
        "area_bruta_privativa": None,
        "area_bruta_construcao": None,
        "area_bruta_dependente": None,
        "tipologia": None,
        "afetacao": None,
        "valor_patrimonial": None,
        "ano_inscricao": None,
        # Titular (FONTE DO NIF!)
        "titular_nome": None,
        "titular_nif": None,
        "titular_morada": None,
        "titular_parte": None,
    }
    
    text_upper = text.upper()
    
    # ===== BLOCO: IDENTIFICAÇÃO DO PRÉDIO =====
    
    # Artigo matricial
    m = re.search(r'ARTIGO\s+MATR[IÍ]CIAL[:\s]+(\d+)', text, re.IGNORECASE)
    if m:
        result["artigo_matricial"] = m.group(1)
        logger.info(f"[OCR CADERNETA] Artigo: {result['artigo_matricial']}")
    
    # Natureza: URBANO ou RÚSTICO
    if "URBANO" in text_upper:
        result["natureza"] = "URBANO"
    elif "RÚSTICO" in text_upper:
        result["natureza"] = "RÚSTICO"
    
    # ===== DETECÇÃO DO TIPO DE IMÓVEL =====
    # Baseado em padrões típicos da Caderneta Predial
    tipo_detectado = None
    
    # PRIMEIRO verificar se é Moradia/Casa (prioridade sobre Apartamento)
    # "Uma casa de habitação" ou "casa de habitação" = Moradia
    if re.search(r'CASA\s*DE\s*HABITA[ÇC][ÃA]O|UMA\s+CASA|MORADIA|VIVENDA|HABITA[ÇC][ÃA]O\s+UNIFAMILIAR', text_upper):
        tipo_detectado = "Moradia"
        logger.info(f"[OCR CADERNETA] Tipo detectado: Moradia (casa de habitação)")
    # "Prédio em Prop. Total sem Andares" = Moradia (não é apartamento)
    elif re.search(r'PR[ÉE]DIO\s+EM\s+PROP\.?\s*TOTAL\s+SEM\s+ANDARES', text_upper):
        tipo_detectado = "Moradia"
        logger.info(f"[OCR CADERNETA] Tipo detectado: Moradia (prédio total sem andares)")
    # Fracção autónoma = Apartamento
    elif re.search(r'FRAC[ÇC][ÃA]O\s+AUT[ÓO]NOMA', text_upper):
        tipo_detectado = "Apartamento"
    elif re.search(r'PRÉDIO\s+EM\s+REGIME\s+DE\s+PROPRIEDADE\s+HORIZONTAL', text_upper):
        tipo_detectado = "Apartamento"
    elif re.search(r'\bANDAR\b|\bPISO\b|\bR/C\b|RES-DO-CH[ÃA]O', text_upper):
        # Só considerar apartamento se não foi já detectado como moradia
        if not tipo_detectado:
            tipo_detectado = "Apartamento"
    elif re.search(r'PR[ÉE]DIO\s+URBANO\s+(?!EM\s+REGIME)', text_upper) and not re.search(r'FRAC[ÇC][ÃA]O', text_upper):
        # Prédio urbano sem fracção = Moradia
        tipo_detectado = "Moradia"
    # Terreno
    elif re.search(r'TERRENO\s+PARA\s+CONSTRU[ÇC][ÃA]O|LOTE\s+DE\s+TERRENO', text_upper):
        tipo_detectado = "Terreno"
    elif result["natureza"] == "RÚSTICO":
        tipo_detectado = "Terreno Rústico"
    # Afetação comercial
    elif re.search(r'COM[ÉE]RCIO|SERVI[ÇC]OS|LOJA|ESCRIT[ÓO]RIO', text_upper):
        tipo_detectado = "Comércio/Serviços"
    elif re.search(r'ARMAZ[ÉE]M|IND[ÚU]STRIA', text_upper):
        tipo_detectado = "Armazém/Industrial"
    # Garage/Estacionamento
    elif re.search(r'GARAGEM|ESTACIONAMENTO|PARQUEAMENTO', text_upper):
        tipo_detectado = "Garagem"
    else:
        # Default baseado na afetação
        afetacao_match = re.search(r'Afec?ta[çc][ãa]o[:\s]+([A-Za-zÀ-ÿ\s]+)', text, re.IGNORECASE)
        if afetacao_match:
            afet = afetacao_match.group(1).upper().strip()
            if "HABITA" in afet:
                tipo_detectado = "Habitação"
            elif "COMÉR" in afet or "SERVI" in afet:
                tipo_detectado = "Comércio/Serviços"
        else:
            tipo_detectado = "Habitação"  # Default seguro
    
    result["tipo_imovel"] = tipo_detectado
    logger.info(f"[OCR CADERNETA] Tipo imóvel detectado: {tipo_detectado}")
    
    # Localização: DISTRITO, CONCELHO, FREGUESIA
    # Formato: "DISTRITO: 10 - LEIRIA" ou "DISTRITO: LEIRIA"
    for campo, key in [("DISTRITO", "distrito"), ("CONCELHO", "concelho"), ("FREGUESIA", "freguesia")]:
        m = re.search(rf'{campo}[:\s]+(?:\d+\s*-\s*)?([A-ZÀ-Ú][A-ZÀ-Úa-zà-ÿ\s]+?)(?:\s+(?:CONCELHO|FREGUESIA|ARTIGO|$))', text, re.IGNORECASE)
        if m:
            result[key] = m.group(1).strip().title()
    
    # Morada/Rua
    m = re.search(r'(?:Av\./Rua/Praça|Rua|Estrada)[:\s]+([^\n]+?)(?:\s+Lugar|\s+Código|$)', text, re.IGNORECASE)
    if m:
        result["morada"] = m.group(1).strip()
    
    # Código Postal
    m = re.search(r'C[óo]digo\s+Postal[:\s]+([\d]{4}-[\d]{3})\s+([A-ZÀ-Ú\s]+)', text, re.IGNORECASE)
    if m:
        result["codigo_postal"] = m.group(1)
        result["localidade"] = m.group(2).strip().title()
    
    # ===== BLOCO: ÁREAS =====
    
    areas_map = [
        (r'[ÁA]rea\s+total\s+do\s+terreno[:\s]+([\d\.,]+)', "area_total_terreno"),
        (r'[ÁA]rea\s+bruta\s+privativa[:\s]+([\d\.,]+)', "area_bruta_privativa"),
        (r'[ÁA]rea\s+bruta\s+de\s+constru[çc][ãa]o[:\s]+([\d\.,]+)', "area_bruta_construcao"),
        (r'[ÁA]rea\s+bruta\s+dependente[:\s]+([\d\.,]+)', "area_bruta_dependente"),
    ]
    for pattern, key in areas_map:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = m.group(1).replace(".", "").replace(",", ".")
            try:
                result[key] = float(val)
                logger.info(f"[OCR CADERNETA] {key}: {result[key]}")
            except:
                pass
    
    # Tipologia
    m = re.search(r'Tipologia/?Divis[õo]es[:\s]+(\d+)', text, re.IGNORECASE)
    if m:
        result["tipologia"] = f"T{m.group(1)}"
    
    # Afetação
    m = re.search(r'Afec?ta[çc][ãa]o[:\s]+([A-Za-zÀ-ÿ]+)', text, re.IGNORECASE)
    if m:
        result["afetacao"] = m.group(1).title()
    
    # Valor patrimonial
    m = re.search(r'Valor\s+patrimonial\s+(?:actual|atual)[^€]*€?\s*([\d\.,]+)', text, re.IGNORECASE)
    if m:
        val = m.group(1).replace(".", "").replace(",", ".")
        try:
            result["valor_patrimonial"] = float(val)
            logger.info(f"[OCR CADERNETA] Valor patrimonial: {result['valor_patrimonial']}")
        except:
            pass
    
    # ===== BLOCO: TITULARES (FONTE DO NIF!) =====
    
    # NIF do titular - ÂNCORA: "Identificação fiscal:"
    m = re.search(r'Identifica[çc][ãa]o\s+fiscal[:\s]+(\d{9})', text, re.IGNORECASE)
    if m:
        result["titular_nif"] = m.group(1)
        logger.info(f"[OCR CADERNETA] ✅ NIF titular: {result['titular_nif']}")
    
    # Nome do titular
    m = re.search(r'Nome[:\s]+([A-ZÀ-Ú][A-ZÀ-Úa-zà-ÿ\s]+?)(?:\s+Morada|$)', text, re.IGNORECASE)
    if m:
        nome = m.group(1).strip()
        if len(nome) > 5:  # Evitar falsos positivos
            result["titular_nome"] = nome.title()
    
    # Morada do titular
    m = re.search(r'Morada[:\s]+(.+?)(?:\s+Tipo\s+de|$)', text, re.IGNORECASE)
    if m:
        result["titular_morada"] = m.group(1).strip()
    
    # Parte (quota)
    m = re.search(r'Parte[:\s]+(\d+/\d+)', text, re.IGNORECASE)
    if m:
        result["titular_parte"] = m.group(1)
    
    return result


# ========== EXTRATOR: CERTIDÃO PERMANENTE ==========

def extrair_certidao(text: str) -> dict:
    """
    Extrator dedicado para Certidão Permanente / Registo Predial.
    DOCUMENTO JURÍDICO - prevalece sobre AT.
    REGRA: Só quem está em SUJEITO(S) ATIVO(S) é proprietário legal.
    """
    logger.info("[OCR CERTIDÃO] Iniciando extração por âncoras")
    
    result = {
        "conservatoria": None,
        "descricao_numero": None,
        "freguesia": None,
        "matriz_numero": None,
        "area_total": None,
        "proprietarios_legais": [],
        "onus": [],
    }
    
    # Conservatória
    m = re.search(r'Conservat[óo]ria[^:]*[:\s]+([A-Za-zÀ-ÿ\s]+?)(?:\s+Freguesia|$)', text, re.IGNORECASE)
    if m:
        result["conservatoria"] = m.group(1).strip()
    
    # Número descrição
    m = re.search(r'Descri[çc][ãa]o[^:]*n[ºo°]?\s*[:\s]*(\d+)', text, re.IGNORECASE)
    if m:
        result["descricao_numero"] = m.group(1)
    
    # Matriz
    m = re.search(r'MATRIZ\s*n[ºo°]?\s*[:\s]*(\d+)', text, re.IGNORECASE)
    if m:
        result["matriz_numero"] = m.group(1)
    
    # Área total
    m = re.search(r'[ÁA]REA\s+TOTAL[:\s]+([\d\.,]+)', text, re.IGNORECASE)
    if m:
        val = m.group(1).replace(".", "").replace(",", ".")
        try:
            result["area_total"] = float(val)
        except:
            pass
    
    # ===== BLOCO CRÍTICO: SUJEITO(S) ATIVO(S) =====
    # Só quem está aqui é proprietário legal!
    sujeito_match = re.search(r'SUJEITO\(?S?\)?\s+ATIVO\(?S?\)?[:\s]+(.+?)(?:SUJEITO\(?S?\)?\s+PASSIVO|INSCRI[ÇC][ÃA]O|$)', text, re.IGNORECASE | re.DOTALL)
    if sujeito_match:
        bloco = sujeito_match.group(1)
        # Extrair nomes e NIFs
        nomes = re.findall(r'([A-ZÀ-Ú][A-ZÀ-Úa-zà-ÿ\s]+?)(?:\s+NIF|\s+,|$)', bloco)
        nifs = re.findall(r'\b(\d{9})\b', bloco)
        for i, nome in enumerate(nomes[:5]):  # Max 5 proprietários
            prop = {"nome": nome.strip().title()}
            if i < len(nifs):
                prop["nif"] = nifs[i]
            result["proprietarios_legais"].append(prop)
            logger.info(f"[OCR CERTIDÃO] ✅ Proprietário legal: {prop}")
    
    return result


# ========== EXTRATOR: CERTIFICADO ENERGÉTICO ==========

def extrair_certificado_energetico(text: str) -> dict:
    """
    Extrator dedicado para Certificado Energético (ADENE).
    Apenas para: classe energética, área útil, validade.
    NUNCA usar para proprietários ou artigos matriciais principais.
    """
    logger.info("[OCR CE] Iniciando extração por âncoras")
    
    result = {
        "numero_certificado": None,
        "classe_energetica": None,
        "area_util": None,
        "validade": None,
        "morada": None,
    }
    
    # Número certificado (SCE...)
    m = re.search(r'SCE\s*(\d+)', text, re.IGNORECASE)
    if m:
        result["numero_certificado"] = f"SCE{m.group(1)}"
    
    # Classe energética (A+, A, B, B-, C, D, E, F)
    m = re.search(r'CLASSE\s+ENERG[ÉE]TICA[:\s]*([A-F][+\-]?)', text, re.IGNORECASE)
    if m:
        result["classe_energetica"] = m.group(1).upper()
        logger.info(f"[OCR CE] Classe: {result['classe_energetica']}")
    
    # Fallback: procurar A+, A, B, etc isolados perto de "classe" ou "energia"
    if not result["classe_energetica"]:
        m = re.search(r'\b([A-F][+\-]?)\b', text)
        if m:
            result["classe_energetica"] = m.group(1).upper()
    
    # Área útil
    m = re.search(r'[ÁA]rea\s+[úu]til[:\s]+([\d\.,]+)', text, re.IGNORECASE)
    if m:
        val = m.group(1).replace(".", "").replace(",", ".")
        try:
            result["area_util"] = float(val)
        except:
            pass
    
    # Validade
    m = re.search(r'V[áa]lid[oa]\s+at[ée][:\s]*(\d{2}[/\-]\d{2}[/\-]\d{4})', text, re.IGNORECASE)
    if m:
        result["validade"] = m.group(1).replace("-", "/")
    
    return result


# ========== ENDPOINT OCR PRINCIPAL ==========

@router.post("/{cmi_id}/ocr", response_model=schemas.DocumentoOCRResponse)
def processar_documento_ocr(
    cmi_id: int,
    data: schemas.DocumentoOCRRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processar imagem de documento via OCR (Google Vision).
    
    Pipeline:
    1. Classificação automática do documento
    2. Extração por âncoras semânticas
    3. Validação por regras
    4. Mapeamento para o contrato
    
    Prioridade de fontes:
    - Proprietários: Registo Predial > AT > CC
    - Imóvel: Registo Predial > AT > Certificado Energético
    """
    if not current_user.agent_id:
        raise HTTPException(status_code=403, detail="Utilizador não tem agente associado")
    
    item = db.query(ContratoMediacaoImobiliaria).filter(
        ContratoMediacaoImobiliaria.id == cmi_id,
        ContratoMediacaoImobiliaria.agent_id == current_user.agent_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="CMI não encontrado")
    
    def parse_decimal(text_val: str):
        """Converter número com vírgula/espacos para Decimal."""
        try:
            cleaned = text_val.replace("€", "").replace(" ", "").replace(".", "").replace(",", ".")
            return Decimal(cleaned)
        except Exception:
            return None

    dados_extraidos = {}
    confianca = 0.0
    mensagem = ""
    doc_tipo = data.tipo  # Campo do schema é 'tipo', não 'tipo_documento'

    # Aceita ambas variantes da env: GCP_VISION_ENABLED ou GCP_VISION_ENABLE
    vision_flag = os.environ.get("GCP_VISION_ENABLED") or os.environ.get("GCP_VISION_ENABLE") or "false"
    use_vision = vision_flag.lower() == "true" and VISION_AVAILABLE
    
    logger.info(f"[OCR] Vision flag: {vision_flag}, VISION_AVAILABLE: {VISION_AVAILABLE}, use_vision: {use_vision}")
    logger.info(f"[OCR] Tipo documento recebido: '{doc_tipo}', imagem base64 length: {len(data.imagem_base64)}")

    full_text = ""
    
    if use_vision:
        try:
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=base64.b64decode(data.imagem_base64))
            response = client.text_detection(image=image)
            if response.error.message:
                raise RuntimeError(response.error.message)
            full_text = response.full_text_annotation.text if response.full_text_annotation else ""
            confianca = 0.9
            mensagem = "Texto extraído com Google Vision"
            logger.info(f"[OCR] Texto extraído ({len(full_text)} chars)")
            
            # SEMPRE classificar documento por âncoras (ignora tipo enviado pelo mobile)
            # Isto é mais fiável porque o mobile pode enviar tipo errado
            tipo_detectado = classificar_documento(full_text)
            logger.info(f"[OCR] Tipo enviado: '{doc_tipo}', Tipo detectado: '{tipo_detectado}'")
            
            # Se o tipo detectado é diferente e mais específico, usar o detectado
            if tipo_detectado != "desconhecido":
                if doc_tipo != tipo_detectado:
                    logger.warning(f"[OCR] ⚠️ Tipo enviado ({doc_tipo}) diferente do detectado ({tipo_detectado}). Usando detectado.")
                doc_tipo = tipo_detectado
            elif not doc_tipo:
                doc_tipo = tipo_detectado
                
        except Exception as e:
            logger.error(f"OCR Vision falhou: {e}")
            mensagem = "OCR Vision indisponível"
            confianca = 0.0
    else:
        logger.warning("[OCR] Google Vision não configurado. Configure GCP_VISION_ENABLE=true")
        mensagem = "⚠️ OCR automático não disponível. Configure GCP_VISION_ENABLE=true no Railway."
        confianca = 0.0
    
    # Guardar foto do documento
    fotos = item.documentos_fotos or []
    fotos.append({
        "tipo": doc_tipo,
        "url": f"data:image/jpeg;base64,{data.imagem_base64[:50]}...",  # Truncar para não guardar tudo
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
        "certificado_energetico": "certificado_energetico",
    }
    doc_tipo_mapped = tipo_map.get(doc_tipo)
    if doc_tipo_mapped:
        for doc in docs:
            if doc.get("tipo") == doc_tipo_mapped:
                doc["entregue"] = True
                doc["data"] = date.today().isoformat()
                break
    item.documentos_entregues = docs

    # ========================================
    # EXTRAÇÃO POR TIPO DE DOCUMENTO
    # ========================================
    updates = {}
    dados_para_mobile = {"raw_text": full_text} if full_text else {}
    
    if full_text:  # Só extrair se tivermos texto
        logger.info(f"[OCR] Extraindo dados do documento tipo: {doc_tipo}")
        
        try:
            # CARTÃO DE CIDADÃO - DADOS DO CLIENTE (quem assina o CMI)
            # IMPORTANTE: O NIF do CC é de quem ASSINA o contrato
            # O NIF da Caderneta pode ser de outra pessoa (ex: falecido, empresa)
            if doc_tipo in ("cc_frente", "cc_verso"):
                parsed = extrair_cc(full_text)
                logger.info(f"[OCR CC] Resultado: {parsed}")
                
                if parsed.get("nome_completo"):
                    updates["cliente_nome"] = parsed["nome_completo"]
                    dados_para_mobile["nome"] = parsed["nome_completo"]
                if parsed.get("numero_documento"):
                    updates["cliente_cc"] = parsed["numero_documento"]
                    dados_para_mobile["numero_documento"] = parsed["numero_documento"]
                if parsed.get("data_validade"):
                    # Converter DD/MM/YYYY para date object (PostgreSQL espera YYYY-MM-DD)
                    data_val = parsed["data_validade"]
                    if "/" in data_val:
                        try:
                            from datetime import datetime
                            dt = datetime.strptime(data_val, "%d/%m/%Y")
                            updates["cliente_cc_validade"] = dt.date()
                        except:
                            updates["cliente_cc_validade"] = data_val
                    else:
                        updates["cliente_cc_validade"] = data_val
                    dados_para_mobile["validade"] = parsed["data_validade"]
                if parsed.get("data_nascimento"):
                    dados_para_mobile["data_nascimento"] = parsed["data_nascimento"]
                if parsed.get("sexo"):
                    dados_para_mobile["sexo"] = parsed["sexo"]
                if parsed.get("nacionalidade"):
                    dados_para_mobile["nacionalidade"] = parsed["nacionalidade"]
                # NIF do CC: É O NIF DO CLIENTE (quem assina o CMI)
                # TEM PRIORIDADE sobre Caderneta porque é quem vai assinar!
                if parsed.get("nif"):
                    updates["cliente_nif"] = parsed["nif"]
                    dados_para_mobile["nif"] = parsed["nif"]
                    logger.info(f"[OCR CC] ✅ NIF do CLIENTE (CC): {parsed['nif']}")
            
            # CADERNETA PREDIAL (FONTE DO NIF!)
            elif doc_tipo == "caderneta_predial":
                parsed = extrair_caderneta(full_text)
                logger.info(f"[OCR CADERNETA] Resultado: {parsed}")
                
                # Dados do imóvel
                if parsed.get("artigo_matricial"):
                    updates["imovel_artigo_matricial"] = parsed["artigo_matricial"]
                    dados_para_mobile["artigo_matricial"] = parsed["artigo_matricial"]
                if parsed.get("distrito"):
                    updates["imovel_distrito"] = parsed["distrito"]
                    dados_para_mobile["distrito"] = parsed["distrito"]
                if parsed.get("concelho"):
                    updates["imovel_concelho"] = parsed["concelho"]
                    dados_para_mobile["concelho"] = parsed["concelho"]
                if parsed.get("freguesia"):
                    updates["imovel_freguesia"] = parsed["freguesia"]
                    dados_para_mobile["freguesia"] = parsed["freguesia"]
                if parsed.get("morada"):
                    updates["imovel_morada"] = parsed["morada"]
                    dados_para_mobile["morada"] = parsed["morada"]
                if parsed.get("codigo_postal"):
                    updates["imovel_codigo_postal"] = parsed["codigo_postal"]
                    dados_para_mobile["codigo_postal"] = parsed["codigo_postal"]
                if parsed.get("localidade"):
                    dados_para_mobile["localidade"] = parsed["localidade"]
                if parsed.get("tipologia"):
                    updates["imovel_tipologia"] = parsed["tipologia"]
                    dados_para_mobile["tipologia"] = parsed["tipologia"]
                if parsed.get("afetacao"):
                    dados_para_mobile["afetacao"] = parsed["afetacao"]
                
                # Tipo de imóvel (Moradia/Apartamento/etc.) - detectado automaticamente
                if parsed.get("tipo_imovel"):
                    updates["imovel_tipo"] = parsed["tipo_imovel"]
                    dados_para_mobile["tipo_imovel"] = parsed["tipo_imovel"]
                    logger.info(f"[OCR] ✅ Tipo imóvel detectado: {parsed['tipo_imovel']}")
                
                # Áreas
                if parsed.get("area_bruta_privativa"):
                    updates["imovel_area_util"] = Decimal(str(parsed["area_bruta_privativa"]))
                    dados_para_mobile["area_util"] = str(parsed["area_bruta_privativa"])
                if parsed.get("area_bruta_construcao"):
                    updates["imovel_area_bruta"] = Decimal(str(parsed["area_bruta_construcao"]))
                    dados_para_mobile["area_bruta"] = str(parsed["area_bruta_construcao"])
                if parsed.get("area_total_terreno"):
                    dados_para_mobile["area_terreno"] = str(parsed["area_total_terreno"])
                
                # Valor patrimonial
                if parsed.get("valor_patrimonial"):
                    dados_para_mobile["valor_patrimonial"] = str(parsed["valor_patrimonial"])
                    if not item.valor_pretendido:
                        updates["valor_pretendido"] = Decimal(str(parsed["valor_patrimonial"]))
                
                # TITULAR E NIF DA CADERNETA (PROPRIETÁRIO REGISTADO NA MATRIZ)
                # ATENÇÃO: Este NIF pode ser diferente do cliente que assina!
                # Ex: Imóvel em nome de falecido, cabeça de casal assina como herdeiro
                # Ex: Imóvel de empresa, representante legal assina
                if parsed.get("titular_nif"):
                    # Enviar como "proprietario_nif" para o mobile distinguir
                    dados_para_mobile["proprietario_nif"] = parsed["titular_nif"]
                    # NÃO atualizar cliente_nif! Esse vem do CC de quem assina
                    logger.info(f"[OCR] ℹ️ NIF PROPRIETÁRIO (Caderneta): {parsed['titular_nif']} - Não é necessariamente o cliente!")
                if parsed.get("titular_nome"):
                    dados_para_mobile["proprietario_nome"] = parsed["titular_nome"]
                    # Só usar para cliente se não tiver nome do CC (fallback)
                    if not item.cliente_nome:
                        updates["cliente_nome"] = parsed["titular_nome"]
                        logger.info(f"[OCR] Nome do proprietário usado como fallback: {parsed['titular_nome']}")
            
            # CERTIDÃO PERMANENTE (PREVALECE SOBRE AT!)
            elif doc_tipo == "certidao_permanente":
                parsed = extrair_certidao(full_text)
                logger.info(f"[OCR CERTIDÃO] Resultado: {parsed}")
                
                if parsed.get("descricao_numero"):
                    updates["imovel_descricao_conservatoria"] = parsed["descricao_numero"]
                    dados_para_mobile["descricao_numero"] = parsed["descricao_numero"]
                if parsed.get("matriz_numero"):
                    updates["imovel_artigo_matricial"] = parsed["matriz_numero"]
                    dados_para_mobile["artigo_matricial"] = parsed["matriz_numero"]
                if parsed.get("area_total"):
                    updates["imovel_area_bruta"] = Decimal(str(parsed["area_total"]))
                    dados_para_mobile["area_bruta"] = str(parsed["area_total"])
                if parsed.get("conservatoria"):
                    dados_para_mobile["conservatoria"] = parsed["conservatoria"]
                
                # Proprietários legais (PREVALECE!)
                if parsed.get("proprietarios_legais"):
                    props = parsed["proprietarios_legais"]
                    dados_para_mobile["proprietarios"] = props
                    # Usar primeiro proprietário como cliente se não houver
                    if props and not item.cliente_nome:
                        updates["cliente_nome"] = props[0].get("nome")
                        if props[0].get("nif"):
                            updates["cliente_nif"] = props[0].get("nif")
            
            # CERTIFICADO ENERGÉTICO
            elif doc_tipo == "certificado_energetico":
                parsed = extrair_certificado_energetico(full_text)
                logger.info(f"[OCR CE] Resultado: {parsed}")
                
                if parsed.get("classe_energetica"):
                    updates["imovel_certificado_energetico"] = parsed["classe_energetica"]
                    dados_para_mobile["classe_energetica"] = parsed["classe_energetica"]
                if parsed.get("numero_certificado"):
                    updates["imovel_certificado_numero"] = parsed["numero_certificado"]
                    dados_para_mobile["numero_certificado"] = parsed["numero_certificado"]
                if parsed.get("area_util"):
                    # Só usar se não tivermos da Caderneta
                    if not item.imovel_area_util:
                        updates["imovel_area_util"] = Decimal(str(parsed["area_util"]))
                    dados_para_mobile["area_util"] = str(parsed["area_util"])
                if parsed.get("validade"):
                    updates["imovel_certificado_validade"] = parsed["validade"]
                    dados_para_mobile["validade_ce"] = parsed["validade"]
        
        except Exception as e:
            logger.error(f"[OCR] Erro na extração de dados: {e}", exc_info=True)
            # Continua sem dados extraídos mas não crashar

    # Persistir updates no CMI
    logger.info(f"[OCR] Aplicando {len(updates)} updates ao CMI")
    if updates:
        for field, value in updates.items():
            if value:
                setattr(item, field, value)
                logger.info(f"[OCR] Set {field} = {value}")

    db.commit()
    db.refresh(item)
    
    # Ajustar confiança se extraímos dados reais
    if updates and confianca > 0:
        confianca = 0.9  # Confiança alta se extraímos e mapeamos campos
    elif dados_para_mobile and confianca > 0:
        confianca = 0.7  # Confiança média se só extraímos sem mapear
    
    logger.info(f"[OCR] Resposta final: tipo={doc_tipo}, campos={len(dados_para_mobile)}, confianca={confianca}")
    
    return schemas.DocumentoOCRResponse(
        sucesso=True,
        tipo=doc_tipo or "desconhecido",
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
