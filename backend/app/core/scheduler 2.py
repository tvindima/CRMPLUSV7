"""
Background Scheduler para Visit Reminders
Verifica a cada minuto se há visitas começando em 30min e envia notificação WebSocket
"""
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.calendar.models import Visit
from app.properties.models import Property
from app.core.events import event_bus

logger = logging.getLogger(__name__)


async def check_upcoming_visits():
    """
    Verifica visitas que começam em 30 minutos
    Envia evento visit_reminder via EventBus → WebSocket
    """
    db: Session = SessionLocal()
    
    try:
        # Janela: visitas entre 29min e 31min no futuro
        now = datetime.utcnow()
        window_start = now + timedelta(minutes=29)
        window_end = now + timedelta(minutes=31)
        
        # Buscar visitas nessa janela (não canceladas)
        upcoming_visits = db.query(Visit).filter(
            Visit.scheduled_at >= window_start,
            Visit.scheduled_at <= window_end,
            Visit.status != "cancelled"
        ).all()
        
        if not upcoming_visits:
            logger.debug(f"Nenhuma visita em 30min (checked at {now.strftime('%H:%M')})")
            return
        
        logger.info(f"Encontradas {len(upcoming_visits)} visitas em 30min")
        
        # Enviar reminder para cada visita
        for visit in upcoming_visits:
            # Buscar property para ter morada
            property = db.query(Property).filter(Property.id == visit.property_id).first()
            
            # Agent ID do agente responsável
            agent_id = visit.agent_id
            
            if not agent_id:
                logger.warning(f"Visit {visit.id} sem agent_id, skip reminder")
                continue
            
            # Preparar dados do reminder
            reminder_data = {
                "visit_id": visit.id,
                "property_id": visit.property_id,
                "property_address": property.address if property else "Morada não disponível",
                "property_reference": property.reference if property else None,
                "scheduled_at": visit.scheduled_at.isoformat(),
                "lead_id": visit.lead_id,
                "minutes_until": 30
            }
            
            # Publicar evento (ConnectionManager vai receber e enviar WebSocket)
            await event_bus.publish("visit_reminder", reminder_data, agent_id=agent_id)
            
            logger.info(f"Reminder enviado para agent {agent_id} (visit {visit.id})")
    
    except Exception as e:
        logger.error(f"Erro ao verificar upcoming visits: {str(e)}", exc_info=True)
    
    finally:
        db.close()


async def start_visit_reminder_scheduler():
    """
    Background task infinito que verifica upcoming visits a cada 1 minuto
    
    Chamado no startup do FastAPI (lifespan)
    Cancelado no shutdown
    """
    logger.info("Visit reminder scheduler STARTED")
    
    while True:
        try:
            await check_upcoming_visits()
            
            # Esperar 1 minuto antes da próxima verificação
            await asyncio.sleep(60)
        
        except asyncio.CancelledError:
            logger.info("Visit reminder scheduler CANCELLED")
            break
        
        except Exception as e:
            logger.error(f"Erro no scheduler loop: {str(e)}", exc_info=True)
            # Continuar mesmo com erro (não crashar o scheduler)
            await asyncio.sleep(60)
