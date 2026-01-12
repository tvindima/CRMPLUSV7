# Import all models to ensure they are registered with SQLAlchemy Base
# Ordem de importação importa para evitar circular references
from app.properties.models import Property
from app.agents.models import Agent
from app.leads.models import Lead  # Lead precisa vir depois de Agent
from app.calendar.models import Task  # Task precisa vir depois de Lead, Property e Agent
from app.models.visit import Visit  # Visit precisa vir depois de Property, Lead e Agent
from app.models.event import Event  # Event precisa vir depois de Agent, Property e Lead
from app.models.first_impression import FirstImpression  # FirstImpression precisa vir depois de Agent, Property e Lead
from app.models.draft_ingestion import DraftProperty, IngestionFile  # Modelos de ingestion
from app.models.agent_site_preferences import AgentSitePreferences  # Preferências site agente
from app.models.pre_angariacao import PreAngariacao  # Pré-angariação / Dossier
from app.models.contrato_mediacao import ContratoMediacaoImobiliaria  # CMI
from app.models.crm_settings import CRMSettings  # Configurações globais CRM (watermark, branding, etc.)
from app.models.client import Client  # Base de dados de clientes por agente
from app.models.opportunity import Opportunity  # Pipeline de oportunidades
from app.models.proposal import Proposal  # Propostas de negócio

__all__ = ["Agent", "Property", "Lead", "Task", "Visit", "Event", "FirstImpression", "DraftProperty", "IngestionFile", "AgentSitePreferences", "PreAngariacao", "ContratoMediacaoImobiliaria", "CRMSettings", "Client", "Opportunity", "Proposal"]
