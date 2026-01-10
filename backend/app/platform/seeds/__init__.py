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
