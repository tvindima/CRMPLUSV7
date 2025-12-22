"""
Event Bus - Sistema pub/sub para eventos real-time
Permite desacoplar lógica de negócio do sistema de notificações
"""
from typing import Dict, List, Callable, Any
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger(__name__)


class Event:
    """Representa um evento no sistema"""
    def __init__(self, event_type: str, data: Dict[str, Any], agent_id: int = None):
        self.event_type = event_type
        self.data = data
        self.agent_id = agent_id  # Para events direcionados a agente específico
        self.timestamp = datetime.utcnow()


class EventBus:
    """
    Event Bus singleton para publish/subscribe de eventos
    
    Uso:
        from app.core.events import event_bus
        
        # Publicar evento
        await event_bus.publish("new_lead", {"lead_id": 123}, agent_id=5)
        
        # Subscrever (geralmente no WebSocket connection manager)
        event_bus.subscribe("new_lead", my_handler_function)
    """
    
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._lock = asyncio.Lock()
    
    def subscribe(self, event_type: str, handler: Callable):
        """
        Regista handler para tipo de evento específico
        
        Args:
            event_type: Nome do evento (ex: "new_lead", "visit_scheduled")
            handler: Função async que recebe Event como argumento
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        
        self._subscribers[event_type].append(handler)
        logger.info(f"Handler registado para evento '{event_type}'")
    
    def unsubscribe(self, event_type: str, handler: Callable):
        """Remove handler de evento"""
        if event_type in self._subscribers:
            try:
                self._subscribers[event_type].remove(handler)
                logger.info(f"Handler removido de evento '{event_type}'")
            except ValueError:
                pass
    
    async def publish(self, event_type: str, data: Dict[str, Any], agent_id: int = None):
        """
        Publica evento para todos os subscribers
        
        Args:
            event_type: Nome do evento
            data: Dados do evento (será JSON no WebSocket)
            agent_id: ID do agente destinatário (opcional, para filtering)
        """
        event = Event(event_type, data, agent_id)
        
        if event_type not in self._subscribers:
            logger.debug(f"Nenhum subscriber para evento '{event_type}'")
            return
        
        # Executar todos os handlers assíncronos
        handlers = self._subscribers[event_type].copy()
        
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Erro ao executar handler para '{event_type}': {str(e)}")
        
        logger.info(f"Evento '{event_type}' publicado para {len(handlers)} subscriber(s)")


# Singleton global
event_bus = EventBus()
