"""
Sector Seeds - Dados iniciais por setor de atividade

Cada setor tem configurações específicas:
- Categorias de produtos/serviços
- Estágios de pipeline
- Configurações default
- Campos personalizados
"""

from typing import Dict, Any, Optional


# ===========================================
# SETOR: IMOBILIÁRIO
# ===========================================

REAL_ESTATE_SEEDS = {
    "settings": {
        "agency_name": "Nova Imobiliária",
        "primary_color": "#E10600",
        "secondary_color": "#C5C5C5",
        "currency": "EUR",
        "currency_symbol": "€",
        "area_unit": "m²",
    },
    "categories": [
        {"name": "Apartamento", "slug": "apartamento", "icon": "building"},
        {"name": "Moradia", "slug": "moradia", "icon": "home"},
        {"name": "Terreno", "slug": "terreno", "icon": "map"},
        {"name": "Loja", "slug": "loja", "icon": "store"},
        {"name": "Escritório", "slug": "escritorio", "icon": "briefcase"},
        {"name": "Armazém", "slug": "armazem", "icon": "warehouse"},
        {"name": "Quinta", "slug": "quinta", "icon": "trees"},
        {"name": "Garagem", "slug": "garagem", "icon": "car"},
    ],
    "stages": [
        {"name": "Novo Lead", "slug": "new", "order": 1, "color": "#6B7280"},
        {"name": "Contactado", "slug": "contacted", "order": 2, "color": "#3B82F6"},
        {"name": "Qualificado", "slug": "qualified", "order": 3, "color": "#8B5CF6"},
        {"name": "Visita Agendada", "slug": "visit_scheduled", "order": 4, "color": "#F59E0B"},
        {"name": "Visita Realizada", "slug": "visit_done", "order": 5, "color": "#10B981"},
        {"name": "Proposta", "slug": "proposal", "order": 6, "color": "#EC4899"},
        {"name": "Negociação", "slug": "negotiation", "order": 7, "color": "#F97316"},
        {"name": "CPCV", "slug": "cpcv", "order": 8, "color": "#14B8A6"},
        {"name": "Escritura", "slug": "deed", "order": 9, "color": "#22C55E"},
        {"name": "Ganho", "slug": "won", "order": 10, "color": "#22C55E"},
        {"name": "Perdido", "slug": "lost", "order": 11, "color": "#EF4444"},
    ],
    "transaction_types": [
        {"name": "Venda", "slug": "sale"},
        {"name": "Arrendamento", "slug": "rent"},
        {"name": "Trespasse", "slug": "transfer"},
    ],
    "property_features": [
        "Piscina", "Jardim", "Garagem", "Terraço", "Varanda",
        "Elevador", "Ar Condicionado", "Aquecimento Central",
        "Lareira", "Suite", "Arrecadação", "Vista Mar",
    ],
}


# ===========================================
# SETOR: AUTOMÓVEL
# ===========================================

AUTOMOTIVE_SEEDS = {
    "settings": {
        "agency_name": "Novo Stand",
        "primary_color": "#1E40AF",
        "secondary_color": "#64748B",
        "currency": "EUR",
        "currency_symbol": "€",
        "distance_unit": "km",
    },
    "categories": [
        {"name": "Ligeiro Passageiros", "slug": "ligeiro", "icon": "car"},
        {"name": "SUV", "slug": "suv", "icon": "truck"},
        {"name": "Comercial", "slug": "comercial", "icon": "van"},
        {"name": "Mota", "slug": "mota", "icon": "bike"},
        {"name": "Clássico", "slug": "classico", "icon": "car-vintage"},
        {"name": "Elétrico", "slug": "eletrico", "icon": "bolt"},
        {"name": "Híbrido", "slug": "hibrido", "icon": "leaf"},
    ],
    "stages": [
        {"name": "Novo Lead", "slug": "new", "order": 1, "color": "#6B7280"},
        {"name": "Contactado", "slug": "contacted", "order": 2, "color": "#3B82F6"},
        {"name": "Interessado", "slug": "interested", "order": 3, "color": "#8B5CF6"},
        {"name": "Test Drive", "slug": "test_drive", "order": 4, "color": "#F59E0B"},
        {"name": "Proposta", "slug": "proposal", "order": 5, "color": "#EC4899"},
        {"name": "Negociação", "slug": "negotiation", "order": 6, "color": "#F97316"},
        {"name": "Financiamento", "slug": "financing", "order": 7, "color": "#14B8A6"},
        {"name": "Venda", "slug": "sale", "order": 8, "color": "#22C55E"},
        {"name": "Entrega", "slug": "delivery", "order": 9, "color": "#22C55E"},
        {"name": "Perdido", "slug": "lost", "order": 10, "color": "#EF4444"},
    ],
    "transaction_types": [
        {"name": "Venda", "slug": "sale"},
        {"name": "Retoma", "slug": "trade_in"},
        {"name": "Leasing", "slug": "leasing"},
        {"name": "Renting", "slug": "renting"},
    ],
    "vehicle_features": [
        "GPS", "Bluetooth", "Câmara Traseira", "Sensores Estacionamento",
        "Cruise Control", "Teto Panorâmico", "Bancos Aquecidos",
        "Start/Stop", "Apple CarPlay", "Android Auto",
    ],
}


# ===========================================
# SETOR: SERVIÇOS
# ===========================================

SERVICES_SEEDS = {
    "settings": {
        "agency_name": "Nova Empresa",
        "primary_color": "#7C3AED",
        "secondary_color": "#A78BFA",
        "currency": "EUR",
        "currency_symbol": "€",
    },
    "categories": [
        {"name": "Consultoria", "slug": "consultoria", "icon": "users"},
        {"name": "Formação", "slug": "formacao", "icon": "graduation-cap"},
        {"name": "Marketing", "slug": "marketing", "icon": "megaphone"},
        {"name": "IT", "slug": "it", "icon": "code"},
        {"name": "Contabilidade", "slug": "contabilidade", "icon": "calculator"},
        {"name": "Jurídico", "slug": "juridico", "icon": "scale"},
        {"name": "Outro", "slug": "outro", "icon": "briefcase"},
    ],
    "stages": [
        {"name": "Lead", "slug": "new", "order": 1, "color": "#6B7280"},
        {"name": "Qualificação", "slug": "qualification", "order": 2, "color": "#3B82F6"},
        {"name": "Reunião", "slug": "meeting", "order": 3, "color": "#8B5CF6"},
        {"name": "Proposta", "slug": "proposal", "order": 4, "color": "#F59E0B"},
        {"name": "Negociação", "slug": "negotiation", "order": 5, "color": "#EC4899"},
        {"name": "Contrato", "slug": "contract", "order": 6, "color": "#14B8A6"},
        {"name": "Em Execução", "slug": "execution", "order": 7, "color": "#22C55E"},
        {"name": "Concluído", "slug": "completed", "order": 8, "color": "#22C55E"},
        {"name": "Perdido", "slug": "lost", "order": 9, "color": "#EF4444"},
    ],
    "transaction_types": [
        {"name": "Projeto", "slug": "project"},
        {"name": "Avença", "slug": "retainer"},
        {"name": "Hora", "slug": "hourly"},
    ],
}


# ===========================================
# SETOR: RETALHO
# ===========================================

RETAIL_SEEDS = {
    "settings": {
        "agency_name": "Nova Loja",
        "primary_color": "#059669",
        "secondary_color": "#34D399",
        "currency": "EUR",
        "currency_symbol": "€",
    },
    "categories": [
        {"name": "Eletrónica", "slug": "eletronica", "icon": "smartphone"},
        {"name": "Moda", "slug": "moda", "icon": "shirt"},
        {"name": "Casa", "slug": "casa", "icon": "home"},
        {"name": "Alimentar", "slug": "alimentar", "icon": "utensils"},
        {"name": "Desporto", "slug": "desporto", "icon": "dumbbell"},
        {"name": "Outro", "slug": "outro", "icon": "box"},
    ],
    "stages": [
        {"name": "Interesse", "slug": "interest", "order": 1, "color": "#6B7280"},
        {"name": "Orçamento", "slug": "quote", "order": 2, "color": "#3B82F6"},
        {"name": "Encomenda", "slug": "order", "order": 3, "color": "#F59E0B"},
        {"name": "Pagamento", "slug": "payment", "order": 4, "color": "#8B5CF6"},
        {"name": "Entrega", "slug": "delivery", "order": 5, "color": "#22C55E"},
        {"name": "Concluído", "slug": "completed", "order": 6, "color": "#22C55E"},
        {"name": "Cancelado", "slug": "cancelled", "order": 7, "color": "#EF4444"},
    ],
    "transaction_types": [
        {"name": "Venda", "slug": "sale"},
        {"name": "Encomenda", "slug": "order"},
        {"name": "Devolução", "slug": "return"},
    ],
}


# ===========================================
# SETOR: HOTELARIA
# ===========================================

HOSPITALITY_SEEDS = {
    "settings": {
        "agency_name": "Novo Hotel",
        "primary_color": "#B45309",
        "secondary_color": "#FBBF24",
        "currency": "EUR",
        "currency_symbol": "€",
    },
    "categories": [
        {"name": "Quarto Single", "slug": "single", "icon": "bed"},
        {"name": "Quarto Duplo", "slug": "double", "icon": "bed-double"},
        {"name": "Suite", "slug": "suite", "icon": "crown"},
        {"name": "Apartamento", "slug": "apartment", "icon": "building"},
        {"name": "Sala de Eventos", "slug": "events", "icon": "users"},
        {"name": "Restaurante", "slug": "restaurant", "icon": "utensils"},
    ],
    "stages": [
        {"name": "Pedido", "slug": "request", "order": 1, "color": "#6B7280"},
        {"name": "Disponibilidade", "slug": "availability", "order": 2, "color": "#3B82F6"},
        {"name": "Reserva", "slug": "booking", "order": 3, "color": "#F59E0B"},
        {"name": "Confirmado", "slug": "confirmed", "order": 4, "color": "#8B5CF6"},
        {"name": "Check-in", "slug": "checkin", "order": 5, "color": "#22C55E"},
        {"name": "Check-out", "slug": "checkout", "order": 6, "color": "#22C55E"},
        {"name": "Cancelado", "slug": "cancelled", "order": 7, "color": "#EF4444"},
    ],
    "transaction_types": [
        {"name": "Reserva", "slug": "booking"},
        {"name": "Walk-in", "slug": "walkin"},
        {"name": "Evento", "slug": "event"},
    ],
}


# ===========================================
# SETOR GENÉRICO
# ===========================================

GENERIC_SEEDS = {
    "settings": {
        "agency_name": "Nova Empresa",
        "primary_color": "#6366F1",
        "secondary_color": "#A5B4FC",
        "currency": "EUR",
        "currency_symbol": "€",
    },
    "categories": [
        {"name": "Produto", "slug": "produto", "icon": "box"},
        {"name": "Serviço", "slug": "servico", "icon": "briefcase"},
        {"name": "Outro", "slug": "outro", "icon": "circle"},
    ],
    "stages": [
        {"name": "Novo", "slug": "new", "order": 1, "color": "#6B7280"},
        {"name": "Em Progresso", "slug": "in_progress", "order": 2, "color": "#3B82F6"},
        {"name": "Proposta", "slug": "proposal", "order": 3, "color": "#F59E0B"},
        {"name": "Negociação", "slug": "negotiation", "order": 4, "color": "#8B5CF6"},
        {"name": "Fechado", "slug": "closed", "order": 5, "color": "#22C55E"},
        {"name": "Perdido", "slug": "lost", "order": 6, "color": "#EF4444"},
    ],
    "transaction_types": [
        {"name": "Venda", "slug": "sale"},
        {"name": "Serviço", "slug": "service"},
    ],
}


# ===========================================
# MAPEAMENTO DE SETORES
# ===========================================

SECTOR_SEEDS_MAP: Dict[str, Dict[str, Any]] = {
    "real_estate": REAL_ESTATE_SEEDS,
    "automotive": AUTOMOTIVE_SEEDS,
    "services": SERVICES_SEEDS,
    "retail": RETAIL_SEEDS,
    "hospitality": HOSPITALITY_SEEDS,
    "other": GENERIC_SEEDS,
}


def get_sector_seeds(sector: str) -> Optional[Dict[str, Any]]:
    """
    Retorna os seeds para um setor específico.
    Retorna seeds genéricos se o setor não for encontrado.
    """
    return SECTOR_SEEDS_MAP.get(sector, GENERIC_SEEDS)


def get_available_sectors() -> Dict[str, str]:
    """Retorna lista de setores disponíveis com nomes amigáveis."""
    return {
        "real_estate": "Imobiliário",
        "automotive": "Automóvel",
        "services": "Serviços",
        "retail": "Retalho",
        "hospitality": "Hotelaria",
        "other": "Outro",
    }


# ===========================================
# TERMINOLOGIA POR SETOR
# ===========================================

# Sub-sectores disponíveis com nome amigável
AVAILABLE_SUB_SECTORS = {
    # Serviços profissionais
    "training": "Formação e Educação",
    "law_firm": "Escritório de Advogados",
    "consulting": "Consultoria",
    "health": "Saúde e Bem-estar",
    "accounting": "Contabilidade",
    "engineering": "Engenharia",
    
    # Indústria e produção
    "manufacturing": "Fabricação/Indústria",
    "construction": "Construção Civil",
    
    # Comércio especializado
    "electronics": "Eletrónica",
    "furniture": "Mobiliário",
    "sports_equipment": "Equipamento Desportivo",
    
    # Outros
    "other_services": "Outro Serviço",
    "other_retail": "Outro Comércio",
}

# Sub-sectores com terminologia específica
SUB_SECTOR_TERMINOLOGY: Dict[str, Dict[str, str]] = {
    # Serviços especializados
    "training": {
        "item": "Curso",
        "items": "Cursos",
        "item_singular": "curso",
        "item_plural": "cursos",
        "visit": "Formação",
        "visits": "Formações",
        "schedule_visit": "Agendar Formação",
    },
    "law_firm": {
        "item": "Processo",
        "items": "Processos",
        "item_singular": "processo",
        "item_plural": "processos",
        "visit": "Consulta",
        "visits": "Consultas",
        "schedule_visit": "Agendar Consulta",
    },
    "consulting": {
        "item": "Projeto",
        "items": "Projetos",
        "item_singular": "projeto",
        "item_plural": "projetos",
        "visit": "Consultoria",
        "visits": "Consultorias",
        "schedule_visit": "Agendar Consultoria",
    },
    "health": {
        "item": "Consulta",
        "items": "Consultas",
        "item_singular": "consulta",
        "item_plural": "consultas",
        "visit": "Atendimento",
        "visits": "Atendimentos",
        "schedule_visit": "Agendar Atendimento",
    },
    "manufacturing": {
        "item": "Produto",
        "items": "Produtos",
        "item_singular": "produto",
        "item_plural": "produtos",
        "visit": "Demonstração",
        "visits": "Demonstrações",
        "schedule_visit": "Agendar Demonstração",
    },
    "accounting": {
        "item": "Cliente",
        "items": "Clientes",
        "item_singular": "cliente",
        "item_plural": "clientes",
        "visit": "Reunião",
        "visits": "Reuniões",
        "schedule_visit": "Agendar Reunião",
    },
    "engineering": {
        "item": "Projeto",
        "items": "Projetos",
        "item_singular": "projeto",
        "item_plural": "projetos",
        "visit": "Reunião Técnica",
        "visits": "Reuniões Técnicas",
        "schedule_visit": "Agendar Reunião",
    },
    "construction": {
        "item": "Obra",
        "items": "Obras",
        "item_singular": "obra",
        "item_plural": "obras",
        "visit": "Visita de Obra",
        "visits": "Visitas de Obra",
        "schedule_visit": "Agendar Visita",
    },
}

def get_available_sub_sectors() -> Dict[str, str]:
    """Retorna sub-sectores disponíveis com nomes amigáveis"""
    return AVAILABLE_SUB_SECTORS

SECTOR_TERMINOLOGY: Dict[str, Dict[str, str]] = {
    "real_estate": {
        # Entidades principais
        "item": "Imóvel",
        "items": "Imóveis",
        "item_singular": "imóvel",
        "item_plural": "imóveis",
        "inventory": "Carteira",
        "inventory_description": "Carteira de Imóveis",
        
        # Ações e tipos
        "new_item": "Novo Imóvel",
        "add_item": "Adicionar Imóvel",
        "edit_item": "Editar Imóvel",
        "view_item": "Ver Imóvel",
        "item_details": "Detalhes do Imóvel",
        "item_list": "Lista de Imóveis",
        
        # Campos específicos
        "reference": "Referência",
        "area": "Área",
        "area_unit": "m²",
        "price": "Preço",
        "location": "Localização",
        "typology": "Tipologia",
        "condition": "Estado",
        
        # Transações
        "transaction_sale": "Venda",
        "transaction_rent": "Arrendamento",
        "transaction_types": "Tipo de Negócio",
        
        # Pipeline específico
        "visit": "Visita",
        "visits": "Visitas",
        "schedule_visit": "Agendar Visita",
        "proposal": "Proposta",
        "cpcv": "CPCV",
        "deed": "Escritura",
        
        # Atores
        "client_buyer": "Comprador",
        "client_seller": "Vendedor",
        "client_tenant": "Inquilino",
        "owner": "Proprietário",
        
        # Outros
        "features": "Características",
        "amenities": "Comodidades",
        "energy_cert": "Certificado Energético",
    },
    
    "automotive": {
        # Entidades principais
        "item": "Veículo",
        "items": "Veículos",
        "item_singular": "veículo",
        "item_plural": "veículos",
        "inventory": "Stock",
        "inventory_description": "Stock de Veículos",
        
        # Ações e tipos
        "new_item": "Novo Veículo",
        "add_item": "Adicionar Veículo",
        "edit_item": "Editar Veículo",
        "view_item": "Ver Veículo",
        "item_details": "Detalhes do Veículo",
        "item_list": "Lista de Veículos",
        
        # Campos específicos
        "reference": "Matrícula",
        "area": "Quilometragem",
        "area_unit": "km",
        "price": "Preço",
        "location": "Localização",
        "typology": "Segmento",
        "condition": "Estado",
        "brand": "Marca",
        "model": "Modelo",
        "year": "Ano",
        "fuel": "Combustível",
        "transmission": "Transmissão",
        "power": "Potência",
        "power_unit": "cv",
        
        # Transações
        "transaction_sale": "Venda",
        "transaction_rent": "Aluguer",
        "transaction_types": "Tipo de Negócio",
        "trade_in": "Retoma",
        "leasing": "Leasing",
        "renting": "Renting",
        
        # Pipeline específico
        "visit": "Test Drive",
        "visits": "Test Drives",
        "schedule_visit": "Agendar Test Drive",
        "proposal": "Proposta",
        "financing": "Financiamento",
        "delivery": "Entrega",
        
        # Atores
        "client_buyer": "Comprador",
        "client_seller": "Vendedor",
        "owner": "Proprietário",
        
        # Outros
        "features": "Equipamento",
        "amenities": "Extras",
        "energy_cert": "Classe Emissões",
    },
    
    "services": {
        # Entidades principais
        "item": "Serviço",
        "items": "Serviços",
        "item_singular": "serviço",
        "item_plural": "serviços",
        "inventory": "Catálogo",
        "inventory_description": "Catálogo de Serviços",
        
        # Ações e tipos
        "new_item": "Novo Serviço",
        "add_item": "Adicionar Serviço",
        "edit_item": "Editar Serviço",
        "view_item": "Ver Serviço",
        "item_details": "Detalhes do Serviço",
        "item_list": "Lista de Serviços",
        
        # Campos específicos
        "reference": "Referência",
        "price": "Preço",
        "duration": "Duração",
        
        # Transações
        "transaction_sale": "Contratação",
        "transaction_types": "Tipo de Contrato",
        
        # Pipeline específico
        "visit": "Reunião",
        "visits": "Reuniões",
        "schedule_visit": "Agendar Reunião",
        "proposal": "Proposta",
        
        # Atores
        "client_buyer": "Cliente",
        "owner": "Prestador",
        
        # Outros
        "features": "Características",
    },
    
    "retail": {
        # Entidades principais
        "item": "Produto",
        "items": "Produtos",
        "item_singular": "produto",
        "item_plural": "produtos",
        "inventory": "Stock",
        "inventory_description": "Stock de Produtos",
        
        # Ações e tipos
        "new_item": "Novo Produto",
        "add_item": "Adicionar Produto",
        "edit_item": "Editar Produto",
        "view_item": "Ver Produto",
        "item_details": "Detalhes do Produto",
        "item_list": "Lista de Produtos",
        
        # Campos específicos
        "reference": "SKU",
        "price": "Preço",
        "stock_qty": "Quantidade",
        
        # Transações
        "transaction_sale": "Venda",
        "transaction_types": "Tipo de Venda",
        
        # Pipeline específico
        "visit": "Atendimento",
        "visits": "Atendimentos",
        "proposal": "Orçamento",
        
        # Atores
        "client_buyer": "Cliente",
        
        # Outros
        "features": "Características",
    },
    
    "hospitality": {
        # Entidades principais
        "item": "Alojamento",
        "items": "Alojamentos",
        "item_singular": "alojamento",
        "item_plural": "alojamentos",
        "inventory": "Disponibilidade",
        "inventory_description": "Disponibilidade de Quartos",
        
        # Ações e tipos
        "new_item": "Novo Quarto",
        "add_item": "Adicionar Quarto",
        "edit_item": "Editar Quarto",
        "view_item": "Ver Quarto",
        "item_details": "Detalhes do Quarto",
        "item_list": "Lista de Quartos",
        
        # Campos específicos
        "reference": "Número",
        "price": "Diária",
        "capacity": "Capacidade",
        
        # Transações
        "transaction_sale": "Reserva",
        "transaction_types": "Tipo de Reserva",
        
        # Pipeline específico
        "visit": "Check-in",
        "visits": "Check-ins",
        "proposal": "Cotação",
        
        # Atores
        "client_buyer": "Hóspede",
        
        # Outros
        "features": "Comodidades",
    },
    
    "other": {
        # Entidades principais (genérico)
        "item": "Item",
        "items": "Itens",
        "item_singular": "item",
        "item_plural": "itens",
        "inventory": "Inventário",
        "inventory_description": "Inventário",
        
        # Ações e tipos
        "new_item": "Novo Item",
        "add_item": "Adicionar Item",
        "edit_item": "Editar Item",
        "view_item": "Ver Item",
        "item_details": "Detalhes do Item",
        "item_list": "Lista de Itens",
        
        # Campos específicos
        "reference": "Referência",
        "price": "Preço",
        
        # Transações
        "transaction_sale": "Venda",
        "transaction_types": "Tipo de Transação",
        
        # Pipeline específico
        "visit": "Contacto",
        "visits": "Contactos",
        "proposal": "Proposta",
        
        # Atores
        "client_buyer": "Cliente",
        
        # Outros
        "features": "Características",
    },
}


def get_sector_terminology(sector: str) -> Dict[str, str]:
    """
    Retorna a terminologia para um setor específico.
    Retorna terminologia genérica se o setor não for encontrado.
    """
    return SECTOR_TERMINOLOGY.get(sector, SECTOR_TERMINOLOGY["other"])


def get_tenant_terminology(tenant_data: dict) -> Dict[str, str]:
    """
    Retorna a terminologia completa para um tenant, aplicando:
    1. Terminologia base do sector
    2. Override do sub_sector (se existir)
    3. Override do custom_terminology (se existir)
    
    Args:
        tenant_data: Dict com 'sector', 'sub_sector' (opcional), 'custom_terminology' (opcional)
    
    Returns:
        Dict com toda a terminologia merged
    """
    sector = tenant_data.get('sector', 'other')
    sub_sector = tenant_data.get('sub_sector')
    custom_terminology = tenant_data.get('custom_terminology', {})
    
    # 1. Base do sector
    terminology = get_sector_terminology(sector).copy()
    
    # 2. Merge sub-sector (se existir)
    if sub_sector and sub_sector in SUB_SECTOR_TERMINOLOGY:
        terminology.update(SUB_SECTOR_TERMINOLOGY[sub_sector])
    
    # 3. Merge custom (prioridade máxima)
    if custom_terminology:
        terminology.update(custom_terminology)
    
    return terminology


def get_term(sector: str, key: str, default: str = "") -> str:
    """
    Retorna um termo específico para um setor.
    
    Exemplo:
        get_term("automotive", "item") -> "Veículo"
        get_term("real_estate", "items") -> "Imóveis"
    """
    terminology = get_sector_terminology(sector)
    return terminology.get(key, default or key)
