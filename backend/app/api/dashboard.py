from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import List, Optional
from app.database import get_db
from app.properties.models import Property
from app.leads.models import Lead
from app.agents.models import Agent
from app.models.escritura import Escritura
from app.api.v1.auth import get_current_user_email

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# ==================== KPIs ====================

@router.get("/kpis")
def get_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    Retorna os KPIs principais do dashboard:
    - Propriedades ativas
    - Novas leads (últimos 7 dias)
    - Propostas em aberto
    - Agentes ativos
    - Trends (percentagens de crescimento)
    """
    try:
        # Propriedades ativas
        try:
            propriedades_ativas = db.query(Property).filter(
                func.upper(Property.status) == 'AVAILABLE'
            ).count()
        except Exception:
            db.rollback()
            propriedades_ativas = 0
        
        # Propriedades ativas há 7 dias (para calcular trend)
        seven_days_ago = datetime.now() - timedelta(days=7)
        try:
            propriedades_ativas_7d_ago = db.query(Property).filter(
                func.upper(Property.status) == 'AVAILABLE',
                Property.created_at <= seven_days_ago
            ).count()
        except Exception:
            db.rollback()
            propriedades_ativas_7d_ago = 0
        
        # Calcular trend de propriedades
        if propriedades_ativas_7d_ago > 0:
            prop_trend = ((propriedades_ativas - propriedades_ativas_7d_ago) / propriedades_ativas_7d_ago) * 100
        else:
            prop_trend = 0
        
        # Novas leads (últimos 7 dias) - apenas com created_at definido
        try:
            novas_leads_7d = db.query(Lead).filter(
                Lead.created_at.isnot(None),
                Lead.created_at >= seven_days_ago
            ).count()
        except Exception:
            db.rollback()
            novas_leads_7d = 0
        
        # Leads há 14 dias (para calcular trend)
        fourteen_days_ago = datetime.now() - timedelta(days=14)
        try:
            seven_to_fourteen_days_ago = db.query(Lead).filter(
                Lead.created_at.isnot(None),
                Lead.created_at >= fourteen_days_ago,
                Lead.created_at < seven_days_ago
            ).count()
        except Exception:
            db.rollback()
            seven_to_fourteen_days_ago = 0
        
        # Calcular trend de leads
        if seven_to_fourteen_days_ago > 0:
            leads_trend = ((novas_leads_7d - seven_to_fourteen_days_ago) / seven_to_fourteen_days_ago) * 100
        else:
            leads_trend = novas_leads_7d * 100 if novas_leads_7d > 0 else 0
        
        # Propostas em aberto (mock - adicionar tabela de propostas futuramente)
        propostas_abertas = 12  # TODO: implementar quando tabela Proposta existir
        propostas_trend = 5.0  # Mock
        
        # Agentes ativos (todos os agentes cadastrados)
        try:
            agentes_ativos = db.query(Agent).count()
        except Exception:
            db.rollback()
            agentes_ativos = 0
        
        # === ESCRITURAS ===
        try:
            # Total de escrituras agendadas (próximos 60 dias)
            hoje = datetime.now()
            escrituras_agendadas = db.query(Escritura).filter(
                Escritura.data_escritura >= hoje,
                Escritura.status.in_(['agendada', 'confirmada'])
            ).count()
            
            # Escrituras com documentação pronta
            escrituras_docs_ok = db.query(Escritura).filter(
                Escritura.data_escritura >= hoje,
                Escritura.status.in_(['agendada', 'confirmada']),
                Escritura.documentacao_pronta == True
            ).count()
            
            # Escrituras com documentação pendente
            escrituras_docs_pendentes = escrituras_agendadas - escrituras_docs_ok
        except Exception:
            db.rollback()
            # Se tabela não existir ainda
            escrituras_agendadas = 0
            escrituras_docs_ok = 0
            escrituras_docs_pendentes = 0
        
        return {
            "propriedades_ativas": propriedades_ativas,
            "novas_leads_7d": novas_leads_7d,
            "propostas_abertas": propostas_abertas,
            "agentes_ativos": agentes_ativos,
            # Escrituras
            "escrituras_agendadas": escrituras_agendadas,
            "escrituras_docs_ok": escrituras_docs_ok,
            "escrituras_docs_pendentes": escrituras_docs_pendentes,
            "trends": {
                "propriedades": f"+{prop_trend:.0f}%" if prop_trend > 0 else f"{prop_trend:.0f}%",
                "propriedades_up": prop_trend > 0,
                "leads": f"+{leads_trend:.0f}%" if leads_trend > 0 else f"{leads_trend:.0f}%",
                "leads_up": leads_trend > 0,
                "propostas": f"+{propostas_trend:.0f}%",
                "propostas_up": True
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar KPIs: {str(e)}")


# ==================== DISTRIBUIÇÃO ====================

@router.get("/distribution/concelho")
def get_properties_by_concelho(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Retorna distribuição de propriedades por concelho"""
    try:
        result = db.query(
            Property.municipality.label('concelho'),
            func.count(Property.id).label('total')
        ).filter(
            func.upper(Property.status) == 'AVAILABLE'
        ).group_by(Property.municipality).order_by(func.count(Property.id).desc()).limit(5).all()
        
        return [{"label": r.concelho or "Outros", "value": r.total} for r in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar distribuição por concelho: {str(e)}")


@router.get("/distribution/tipologia")
def get_properties_by_tipologia(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Retorna distribuição de propriedades por tipologia"""
    try:
        # Mapear typology para categorias (T0, T1, T2, T3, T4+, Outros)
        result = db.query(
            Property.typology,
            func.count(Property.id).label('total')
        ).filter(
            func.upper(Property.status) == 'AVAILABLE'
        ).group_by(Property.typology).all()
        
        total_props = sum(r.total for r in result)
        
        # Agrupar em categorias
        tipologias = {}
        for r in result:
            tipo = r.typology or "Outros"
            if tipo not in tipologias:
                tipologias[tipo] = 0
            tipologias[tipo] += r.total
        
        # Calcular percentagens
        distribution = []
        colors = {
            "T1": "#3b82f6",
            "T2": "#a855f7",
            "T3": "#E10600",
            "T4": "#14b8a6"
        }
        
        for tipo, count in sorted(tipologias.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_props * 100) if total_props > 0 else 0
            color = colors.get(tipo, "#6b7280")
            distribution.append({
                "label": tipo,
                "value": round(percentage, 1),
                "color": color
            })
        
        return distribution[:4]  # Top 4 tipologias
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar distribuição por tipologia: {str(e)}")


@router.get("/distribution/status")
def get_properties_by_status(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Retorna distribuição de propriedades por estado"""
    try:
        result = db.query(
            Property.status,
            func.count(Property.id).label('total')
        ).group_by(Property.status).all()
        
        total_props = sum(r.total for r in result)
        
        status_map = {
            "AVAILABLE": {"label": "Disponível", "color": "#10b981"},
            "RESERVED": {"label": "Reservado", "color": "#f59e0b"},
            "SOLD": {"label": "Vendido", "color": "#ef4444"}
        }
        
        distribution = []
        for r in result:
            status_info = status_map.get(r.status, {"label": r.status, "color": "#6b7280"})
            percentage = (r.total / total_props * 100) if total_props > 0 else 0
            distribution.append({
                "label": status_info["label"],
                "value": round(percentage, 1),
                "color": status_info["color"]
            })
        
        return distribution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar distribuição por status: {str(e)}")


# ==================== EQUIPA / AGENTES ====================

@router.get("/agents/ranking")
def get_agents_ranking(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    Retorna ranking semanal dos agentes com métricas:
    - Leads atribuídas
    - Propostas geradas
    - Visitas realizadas
    - Performance score
    """
    try:
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        # Query todos os agentes EXCETO a agência "Imóveis Mais Leiria"
        agents = db.query(Agent).filter(Agent.name != "Imóveis Mais Leiria").all()
        
        ranking = []
        for agent in agents:
            # Contar leads atribuídas ao agente (últimos 7 dias) - apenas com created_at
            leads_count = db.query(Lead).filter(
                Lead.assigned_agent_id == agent.id,
                Lead.created_at.isnot(None),
                Lead.created_at >= seven_days_ago
            ).count()
            
            # Propostas e visitas (mock - implementar quando tabelas existirem)
            propostas_count = int(leads_count * 0.5)  # Mock: ~50% das leads geram proposta
            visitas_count = int(leads_count * 0.3)  # Mock: ~30% das leads geram visita
            
            # Calcular performance score (0-100)
            # Fórmula: (leads * 3 + propostas * 5 + visitas * 2) / fator_normalizacao
            performance = min(100, (leads_count * 3 + propostas_count * 5 + visitas_count * 2) / 2)
            
            ranking.append({
                "id": agent.id,
                "name": agent.name,
                "avatar": agent.avatar_url or f"/avatars/{agent.id}.png",
                "role": "Consultor Imobiliário",
                "leads": leads_count,
                "propostas": propostas_count,
                "visitas": visitas_count,
                "performance": round(performance, 0)
            })
        
        # Ordenar alfabeticamente por nome
        ranking.sort(key=lambda x: x['name'])
        
        # Adicionar rank
        for idx, agent_data in enumerate(ranking, start=1):
            agent_data['rank'] = idx
        
        return ranking
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar ranking de agentes: {str(e)}")


# ==================== LEADS ====================

@router.get("/leads/recent")
def get_recent_leads(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Retorna as leads mais recentes com informação do agente responsável"""
    try:
        # Apenas leads com created_at definido
        leads = db.query(Lead).filter(
            Lead.created_at.isnot(None)
        ).order_by(Lead.created_at.desc()).limit(limit).all()
        
        result = []
        for lead in leads:
            # Buscar agente responsável
            agent = db.query(Agent).filter(Agent.id == lead.assigned_agent_id).first() if lead.assigned_agent_id else None
            
            # Buscar propriedade associada se existir
            property_info = None
            if lead.property_id:
                prop = db.query(Property).filter(Property.id == lead.property_id).first()
                if prop:
                    property_info = f"{prop.property_type or 'Imóvel'} - {prop.location or 'N/A'}"
            
            # Calcular tempo desde criação
            if lead.created_at:
                time_diff = datetime.now() - lead.created_at
                if time_diff.days > 0:
                    tempo = f"{time_diff.days}d" if time_diff.days > 1 else "Ontem"
                elif time_diff.seconds // 3600 > 0:
                    tempo = f"{time_diff.seconds // 3600}h"
                else:
                    tempo = f"{time_diff.seconds // 60}min"
            else:
                tempo = "N/A"
            
            result.append({
                "id": lead.id,
                "cliente": lead.name,
                "tipo": property_info or f"{lead.source or 'Lead'} - {lead.action_type or 'Contacto'}",
                "status": lead.status.lower() if lead.status else "new",
                "responsavel": agent.name.split()[0] if agent else None,
                "responsavel_id": agent.id if agent else None,
                "tempo": tempo,
                "timestamp": lead.created_at.isoformat() if lead.created_at else None
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar leads recentes: {str(e)}")


@router.post("/leads/{lead_id}/assign")
def assign_lead_to_agent(
    lead_id: int,
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Atribui uma lead a um agente específico"""
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrada")
        
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        
        lead.assigned_agent_id = agent_id
        lead.updated_at = datetime.now()
        db.commit()
        
        return {
            "success": True,
            "message": f"Lead atribuída a {agent.name}",
            "lead_id": lead_id,
            "agent_id": agent_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atribuir lead: {str(e)}")


@router.post("/leads/distribute/auto")
def distribute_leads_automatically(
    strategy: str = "round-robin",  # round-robin | performance-based | workload-balanced
    lead_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    Distribui leads automaticamente entre agentes ativos
    Estratégias:
    - round-robin: Distribuição circular
    - performance-based: Prioriza agentes com melhor performance
    - workload-balanced: Equilibra workload entre agentes
    """
    try:
        # Buscar todos os agentes (exceto agência principal)
        agents = db.query(Agent).filter(Agent.name != "Imóveis Mais Leiria").all()
        if not agents:
            raise HTTPException(status_code=400, detail="Nenhum agente ativo disponível")
        
        # Buscar leads pendentes (sem agente atribuído)
        query = db.query(Lead).filter(Lead.assigned_agent_id == None)
        if lead_ids:
            query = query.filter(Lead.id.in_(lead_ids))
        
        pending_leads = query.all()
        if not pending_leads:
            return {"success": True, "message": "Nenhuma lead pendente para distribuir", "distributed": 0}
        
        # Estratégia de distribuição
        if strategy == "round-robin":
            # Distribuição circular simples
            for idx, lead in enumerate(pending_leads):
                agent = agents[idx % len(agents)]
                lead.assigned_agent_id = agent.id
                lead.updated_at = datetime.now()
        
        elif strategy == "performance-based":
            # Ordenar agentes por performance (mock - usar métricas reais)
            agents_sorted = sorted(agents, key=lambda a: a.id, reverse=True)  # Mock
            # Atribuir mais leads aos top performers
            for idx, lead in enumerate(pending_leads):
                # Top 50% dos agentes recebem 70% das leads
                if idx < len(pending_leads) * 0.7:
                    agent = agents_sorted[idx % (len(agents_sorted) // 2 or 1)]
                else:
                    agent = agents_sorted[idx % len(agents_sorted)]
                lead.assigned_agent_id = agent.id
                lead.updated_at = datetime.now()
        
        else:  # workload-balanced
            # Contar workload atual de cada agente
            workload = {}
            for agent in agents:
                count = db.query(Lead).filter(Lead.assigned_agent_id == agent.id).count()
                workload[agent.id] = count
            
            # Atribuir leads ao agente com menos workload
            for lead in pending_leads:
                agent_id_min_workload = min(workload, key=workload.get)
                lead.assigned_agent_id = agent_id_min_workload
                lead.updated_at = datetime.now()
                workload[agent_id_min_workload] += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"{len(pending_leads)} leads distribuídas com estratégia '{strategy}'",
            "distributed": len(pending_leads),
            "strategy": strategy
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao distribuir leads: {str(e)}")


# ==================== TAREFAS (Mock - implementar tabela futura) ====================

@router.get("/tasks/today")
def get_today_tasks(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Retorna tarefas pendentes para hoje (Mock - implementar quando tabela Task existir)"""
    # TODO: Implementar quando criar tabela Task
    mock_tasks = [
        {
            "id": 1,
            "tipo": "reuniao",
            "titulo": "Reunião de equipa semanal",
            "responsavel": "Todos",
            "hora": "10:00",
            "urgente": True
        },
        {
            "id": 2,
            "tipo": "chamada",
            "titulo": "Follow-up cliente João Silva",
            "responsavel": "Tiago V.",
            "hora": "11:30",
            "urgente": True
        },
        {
            "id": 3,
            "tipo": "visita",
            "titulo": "Visita T3 Porto - Maria Santos",
            "responsavel": "Bruno L.",
            "hora": "14:00",
            "urgente": False
        },
        {
            "id": 4,
            "tipo": "revisao",
            "titulo": "Revisar proposta T2 Lisboa",
            "responsavel": "Sara C.",
            "hora": "16:00",
            "urgente": False
        }
    ]
    return mock_tasks


# ==================== ATIVIDADES RECENTES ====================

@router.get("/activities/recent")
def get_recent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """Retorna atividades recentes da equipa (baseado em logs de alterações)"""
    try:
        # Buscar propriedades recentemente criadas/atualizadas (apenas com datas válidas)
        recent_props = db.query(Property).filter(
            Property.updated_at.isnot(None),
            Property.created_at.isnot(None)
        ).order_by(Property.updated_at.desc()).limit(5).all()
        
        # Buscar leads recentemente criadas/atualizadas (apenas com datas válidas)
        recent_leads = db.query(Lead).filter(
            Lead.updated_at.isnot(None),
            Lead.created_at.isnot(None)
        ).order_by(Lead.updated_at.desc()).limit(5).all()
        
        activities = []
        
        # Adicionar atividades de propriedades
        for prop in recent_props:
            if not prop.updated_at or not prop.created_at:
                continue
            time_diff = datetime.now() - prop.updated_at
            if time_diff.days > 0:
                tempo = f"Há {time_diff.days}d"
            elif time_diff.seconds // 3600 > 0:
                tempo = f"Há {time_diff.seconds // 3600}h"
            else:
                tempo = f"Há {time_diff.seconds // 60}min"
            
            # Determinar se foi criação ou edição
            tipo = "criou" if (prop.updated_at - prop.created_at).seconds < 60 else "editou"
            
            activities.append({
                "id": f"prop_{prop.id}",
                "user": "Sistema",  # TODO: adicionar user_id nas tabelas
                "avatar": "/avatars/default.png",
                "acao": f"{tipo} propriedade {prop.typology or ''} em {prop.municipality or 'N/A'}",
                "tipo": tipo,
                "time": tempo,
                "timestamp": prop.updated_at.isoformat()
            })
        
        # Adicionar atividades de leads
        for lead in recent_leads:
            if not lead.updated_at or not lead.created_at:
                continue
            time_diff = datetime.now() - lead.updated_at
            if time_diff.days > 0:
                tempo = f"Há {time_diff.days}d"
            elif time_diff.seconds // 3600 > 0:
                tempo = f"Há {time_diff.seconds // 3600}h"
            else:
                tempo = f"Há {time_diff.seconds // 60}min"
            
            tipo = "criou" if (lead.updated_at - lead.created_at).seconds < 60 else "editou"
            
            # Buscar agente
            agent = db.query(Agent).filter(Agent.id == lead.assigned_agent_id).first() if lead.assigned_agent_id else None
            
            acao = f"{tipo} lead de {lead.name}"
            if agent and tipo == "editou":
                acao = f"atribuiu lead a {agent.name.split()[0]}"
                tipo = "atribuiu"
            
            activities.append({
                "id": f"lead_{lead.id}",
                "user": agent.name if agent else "Sistema",
                "avatar": (agent.avatar_url or f"/avatars/{agent.id}.png") if agent else "/avatars/default.png",
                "acao": acao,
                "tipo": tipo,
                "time": tempo,
                "timestamp": lead.updated_at.isoformat()
            })
        
        # Ordenar por timestamp (mais recente primeiro)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar atividades: {str(e)}")

# ==================== AGENT-SPECIFIC ENDPOINTS ====================

@router.get("/agent/kpis")
def get_agent_kpis(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    KPIs pessoais do agente autenticado:
    - Minhas propriedades ativas
    - Minhas leads (últimos 7 dias)
    - Minhas propostas em aberto
    - Minhas visitas agendadas
    - Trends pessoais
    """
    try:
        # Buscar agent_id pelo email do usuário autenticado
        agent = db.query(Agent).filter(Agent.email == current_user).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        
        agent_id = agent.id
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        # Propriedades ativas do agente
        propriedades_ativas = db.query(Property).filter(
            Property.agent_id == agent_id,
            Property.status == 'available'
        ).count()
        
        # Propriedades ativas há 7 dias
        propriedades_ativas_7d_ago = db.query(Property).filter(
            Property.agent_id == agent_id,
            Property.status == 'available',
            Property.created_at <= seven_days_ago
        ).count()
        
        # Trend de propriedades
        if propriedades_ativas_7d_ago > 0:
            prop_trend = ((propriedades_ativas - propriedades_ativas_7d_ago) / propriedades_ativas_7d_ago) * 100
        else:
            prop_trend = 0
        
        # Leads atribuídas ao agente (últimos 7 dias)
        novas_leads_7d = db.query(Lead).filter(
            Lead.assigned_agent_id == agent_id,
            Lead.created_at >= seven_days_ago
        ).count()
        
        # Leads há 7 dias
        novas_leads_7d_ago = db.query(Lead).filter(
            Lead.assigned_agent_id == agent_id,
            Lead.created_at >= (datetime.now() - timedelta(days=14)),
            Lead.created_at < seven_days_ago
        ).count()
        
        # Trend de leads
        if novas_leads_7d_ago > 0:
            leads_trend = ((novas_leads_7d - novas_leads_7d_ago) / novas_leads_7d_ago) * 100
        else:
            leads_trend = 0
        
        # Propostas em aberto (mock: 50% das leads)
        propostas_abertas = int(novas_leads_7d * 0.5)
        propostas_abertas_7d_ago = int(novas_leads_7d_ago * 0.5)
        
        # Trend de propostas
        if propostas_abertas_7d_ago > 0:
            propostas_trend = ((propostas_abertas - propostas_abertas_7d_ago) / propostas_abertas_7d_ago) * 100
        else:
            propostas_trend = 0
        
        # Visitas agendadas (mock: 30% das leads)
        visitas_agendadas = int(novas_leads_7d * 0.3)
        
        return {
            "propriedades_ativas": propriedades_ativas,
            "novas_leads_7d": novas_leads_7d,
            "propostas_abertas": propostas_abertas,
            "visitas_agendadas": visitas_agendadas,
            "trends": {
                "propriedades": f"{prop_trend:+.0f}%",
                "propriedades_up": prop_trend > 0,
                "leads": f"{leads_trend:+.0f}%",
                "leads_up": leads_trend > 0,
                "propostas": f"{propostas_trend:+.0f}%",
                "propostas_up": propostas_trend > 0
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar KPIs: {str(e)}")

@router.get("/agent/leads")
def get_agent_leads(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    Retorna apenas as leads atribuídas ao agente autenticado
    """
    try:
        # Buscar agent_id
        agent = db.query(Agent).filter(Agent.email == current_user).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        
        # Leads do agente (ordenadas por data de criação)
        leads = db.query(Lead).filter(
            Lead.assigned_agent_id == agent.id
        ).order_by(Lead.created_at.desc()).limit(limit).all()
        
        result = []
        for lead in leads:
            # Calcular tempo decorrido
            now = datetime.now()
            delta = now - lead.created_at if lead.created_at else timedelta(0)
            
            if delta.days > 0:
                tempo = f"{delta.days}d" if delta.days == 1 else f"{delta.days}d"
            else:
                horas = delta.seconds // 3600
                tempo = f"{horas}h" if horas > 0 else "Agora"
            
            result.append({
                "id": lead.id,
                "nome": lead.name,
                "email": lead.email,
                "phone": lead.phone,
                "origem": lead.origin or "Website",
                "status": lead.status,
                "responsavel": agent.name,  # Sempre o próprio agente
                "tempo": tempo,
                "timestamp": lead.created_at.isoformat() if lead.created_at else None
            })
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar leads: {str(e)}")

@router.get("/agent/tasks")
def get_agent_tasks(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    Retorna tarefas pessoais do agente autenticado.
    TODO: Criar tabela Task no futuro
    """
    try:
        # Buscar agent
        agent = db.query(Agent).filter(Agent.email == current_user).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        
        # Mock tasks (enquanto não há tabela Task)
        return [
            {
                "id": 1,
                "titulo": f"Ligar para leads pendentes",
                "tipo": "call",
                "hora": "09:00",
                "prioridade": "high",
                "concluida": False
            },
            {
                "id": 2,
                "titulo": f"Preparar proposta Apartamento T2",
                "tipo": "proposta",
                "hora": "11:30",
                "prioridade": "medium",
                "concluida": False
            },
            {
                "id": 3,
                "titulo": f"Visita agendada - Moradia V3",
                "tipo": "visita",
                "hora": "15:00",
                "prioridade": "high",
                "concluida": False
            }
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar tarefas: {str(e)}")

@router.get("/agent/activities")
def get_agent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user_email)
):
    """
    Retorna atividades pessoais do agente autenticado
    (Propriedades criadas/editadas + Leads atribuídas)
    """
    try:
        # Buscar agent
        agent = db.query(Agent).filter(Agent.email == current_user).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agente não encontrado")
        
        activities = []
        
        # Propriedades criadas pelo agente
        propriedades = db.query(Property).filter(
            Property.agent_id == agent.id
        ).order_by(Property.created_at.desc()).limit(5).all()
        
        for prop in propriedades:
            if prop.created_at:
                now = datetime.now()
                delta = now - prop.created_at
                
                if delta.days > 1:
                    tempo = "Ontem" if delta.days == 1 else f"{delta.days}d"
                else:
                    horas = delta.seconds // 3600
                    tempo = f"{horas}h" if horas > 0 else "Agora"
                
                activities.append({
                    "id": len(activities) + 1,
                    "user": agent.name,
                    "avatar": agent.avatar_url or "/avatars/default.png",
                    "acao": f"Criou propriedade {prop.reference}",
                    "tipo": "property",
                    "time": tempo,
                    "timestamp": prop.created_at.isoformat()
                })
        
        # Leads atribuídas ao agente
        leads = db.query(Lead).filter(
            Lead.assigned_agent_id == agent.id
        ).order_by(Lead.created_at.desc()).limit(5).all()
        
        for lead in leads:
            if lead.created_at:
                now = datetime.now()
                delta = now - lead.created_at
                
                if delta.days > 1:
                    tempo = "Ontem" if delta.days == 1 else f"{delta.days}d"
                else:
                    horas = delta.seconds // 3600
                    tempo = f"{horas}h" if horas > 0 else "Agora"
                
                activities.append({
                    "id": len(activities) + 1,
                    "user": agent.name,
                    "avatar": agent.avatar_url or "/avatars/default.png",
                    "acao": f"Recebeu lead de {lead.name}",
                    "tipo": "lead",
                    "time": tempo,
                    "timestamp": lead.created_at.isoformat()
                })
        
        # Ordenar por timestamp (mais recente primeiro)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:limit]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar atividades: {str(e)}")
