"""
WebSocket Connection Manager
Gere conexões WebSocket para notificações real-time mobile
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
from datetime import datetime
import json
import logging

from app.core.events import Event, event_bus

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Gere conexões WebSocket ativas
    
    Cada agente pode ter múltiplas conexões (multi-device)
    Subscreve eventos do EventBus e envia via WebSocket
    """
    
    def __init__(self):
        # agent_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}
        
        # Registar handler no event bus
        event_bus.subscribe("new_lead", self._handle_new_lead)
        event_bus.subscribe("visit_scheduled", self._handle_visit_scheduled)
        event_bus.subscribe("visit_reminder", self._handle_visit_reminder)
    
    async def connect(self, websocket: WebSocket, agent_id: int):
        """Aceita conexão WebSocket e adiciona ao pool do agente"""
        await websocket.accept()
        
        if agent_id not in self.active_connections:
            self.active_connections[agent_id] = []
        
        self.active_connections[agent_id].append(websocket)
        logger.info(f"WebSocket conectado: agent_id={agent_id}, total={len(self.active_connections[agent_id])}")
        
        # Enviar mensagem de boas-vindas
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket conectado com sucesso",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def disconnect(self, websocket: WebSocket, agent_id: int):
        """Remove conexão do pool"""
        if agent_id in self.active_connections:
            try:
                self.active_connections[agent_id].remove(websocket)
                logger.info(f"WebSocket desconectado: agent_id={agent_id}")
                
                # Limpar lista vazia
                if not self.active_connections[agent_id]:
                    del self.active_connections[agent_id]
            except ValueError:
                pass
    
    async def send_to_agent(self, agent_id: int, message: dict):
        """
        Envia mensagem para TODAS as conexões de um agente (multi-device)
        
        Args:
            agent_id: ID do agente destinatário
            message: Dict com dados (será convertido para JSON)
        """
        if agent_id not in self.active_connections:
            logger.debug(f"Agente {agent_id} não tem conexões WebSocket ativas")
            return
        
        # Enviar para todos os dispositivos do agente
        dead_connections = []
        
        for websocket in self.active_connections[agent_id]:
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                dead_connections.append(websocket)
            except Exception as e:
                logger.error(f"Erro ao enviar WebSocket para agent {agent_id}: {str(e)}")
                dead_connections.append(websocket)
        
        # Limpar conexões mortas
        for ws in dead_connections:
            self.disconnect(ws, agent_id)
    
    async def broadcast(self, message: dict):
        """Envia mensagem para TODOS os agentes conectados"""
        for agent_id in list(self.active_connections.keys()):
            await self.send_to_agent(agent_id, message)
    
    # =====================================================
    # EVENT BUS HANDLERS
    # =====================================================
    
    async def _handle_new_lead(self, event: Event):
        """
        Handler para evento new_lead
        Envia notificação ao agente que recebeu o lead
        """
        if not event.agent_id:
            logger.warning("Evento new_lead sem agent_id")
            return
        
        message = {
            "type": "new_lead",
            "title": "Novo Lead Recebido! 🎉",
            "body": f"{event.data.get('name', 'Cliente')} - {event.data.get('property_type', 'Propriedade')}",
            "data": event.data,
            "timestamp": event.timestamp.isoformat(),
            "sound": "default"
        }
        
        await self.send_to_agent(event.agent_id, message)
        logger.info(f"Notificação new_lead enviada para agent {event.agent_id}")
    
    async def _handle_visit_scheduled(self, event: Event):
        """
        Handler para evento visit_scheduled
        Envia notificação ao agente que tem a visita agendada
        """
        if not event.agent_id:
            logger.warning("Evento visit_scheduled sem agent_id")
            return
        
        message = {
            "type": "visit_scheduled",
            "title": "Visita Agendada 📅",
            "body": f"{event.data.get('scheduled_at', 'Data')} - {event.data.get('property_address', 'Propriedade')}",
            "data": event.data,
            "timestamp": event.timestamp.isoformat(),
            "sound": "default"
        }
        
        await self.send_to_agent(event.agent_id, message)
        logger.info(f"Notificação visit_scheduled enviada para agent {event.agent_id}")
    
    async def _handle_visit_reminder(self, event: Event):
        """
        Handler para evento visit_reminder
        Lembrete 30min antes da visita
        """
        if not event.agent_id:
            logger.warning("Evento visit_reminder sem agent_id")
            return
        
        message = {
            "type": "visit_reminder",
            "title": "Lembrete: Visita em 30 minutos! ⏰",
            "body": event.data.get('property_address', 'Propriedade'),
            "data": event.data,
            "timestamp": event.timestamp.isoformat(),
            "sound": "alarm",
            "priority": "high"
        }
        
        await self.send_to_agent(event.agent_id, message)
        logger.info(f"Notificação visit_reminder enviada para agent {event.agent_id}")


# Singleton global
connection_manager = ConnectionManager()
