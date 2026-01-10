"""
Sector Form Fields - Definição de campos de formulário por setor

Cada setor tem campos específicos para o seu tipo de produto/serviço:
- Imobiliário: área, quartos, tipologia, certificado energético
- Automóvel: marca, modelo, ano, km, combustível, potência
- Serviços: duração, tipo de serviço
- etc.
"""

from typing import Dict, Any, List


# ===========================================
# DEFINIÇÃO DE CAMPOS
# ===========================================

class FieldType:
    """Tipos de campo suportados"""
    TEXT = "text"
    NUMBER = "number"
    SELECT = "select"
    MULTISELECT = "multiselect"
    TEXTAREA = "textarea"
    CHECKBOX = "checkbox"
    DATE = "date"
    CURRENCY = "currency"
    FILE = "file"


def field(
    name: str,
    label: str,
    field_type: str = FieldType.TEXT,
    required: bool = False,
    options: List[Dict] = None,
    placeholder: str = "",
    help_text: str = "",
    unit: str = "",
    min_value: float = None,
    max_value: float = None,
    section: str = "general",
    order: int = 0,
    depends_on: str = None,
    api_field: str = None,  # Nome do campo na API se diferente
) -> Dict[str, Any]:
    """Helper para criar definição de campo"""
    return {
        "name": name,
        "label": label,
        "type": field_type,
        "required": required,
        "options": options or [],
        "placeholder": placeholder,
        "help_text": help_text,
        "unit": unit,
        "min_value": min_value,
        "max_value": max_value,
        "section": section,
        "order": order,
        "depends_on": depends_on,
        "api_field": api_field or name,
    }


# ===========================================
# CAMPOS COMUNS A TODOS OS SETORES
# ===========================================

COMMON_FIELDS = [
    field("reference", "Referência", required=True, section="identification", order=1),
    field("title", "Título", section="identification", order=2),
    field("price", "Preço", FieldType.CURRENCY, required=True, section="pricing", order=1),
    field("description", "Descrição", FieldType.TEXTAREA, section="description", order=1),
    field("observations", "Observações Internas", FieldType.TEXTAREA, section="description", order=2,
          help_text="Notas internas, não visíveis no site"),
    field("status", "Estado da Publicação", FieldType.SELECT, section="status", order=1, options=[
        {"value": "AVAILABLE", "label": "Disponível"},
        {"value": "RESERVED", "label": "Reservado"},
        {"value": "SOLD", "label": "Vendido"},
        {"value": "CANCELLED", "label": "Cancelado"},
    ]),
    field("is_published", "Publicar no site", FieldType.CHECKBOX, section="status", order=2),
    field("is_featured", "Destaque", FieldType.CHECKBOX, section="status", order=3),
]


# ===========================================
# IMOBILIÁRIO
# ===========================================

REAL_ESTATE_FIELDS = [
    # Tipo de negócio
    field("business_type", "Tipo de Negócio", FieldType.SELECT, required=True, section="type", order=1, options=[
        {"value": "sale", "label": "Venda"},
        {"value": "rent", "label": "Arrendamento"},
        {"value": "transfer", "label": "Trespasse"},
    ]),
    field("property_type", "Tipo de Imóvel", FieldType.SELECT, required=True, section="type", order=2, options=[
        {"value": "apartamento", "label": "Apartamento"},
        {"value": "moradia", "label": "Moradia"},
        {"value": "terreno", "label": "Terreno"},
        {"value": "loja", "label": "Loja"},
        {"value": "escritorio", "label": "Escritório"},
        {"value": "armazem", "label": "Armazém"},
        {"value": "garagem", "label": "Garagem"},
        {"value": "predio", "label": "Prédio"},
        {"value": "quinta", "label": "Quinta"},
        {"value": "casa_antiga", "label": "Casa Antiga"},
    ]),
    field("typology", "Tipologia", FieldType.SELECT, section="type", order=3, options=[
        {"value": "T0", "label": "T0"},
        {"value": "T1", "label": "T1"},
        {"value": "T2", "label": "T2"},
        {"value": "T3", "label": "T3"},
        {"value": "T4", "label": "T4"},
        {"value": "T5", "label": "T5"},
        {"value": "T6+", "label": "T6+"},
    ]),
    
    # Áreas
    field("usable_area", "Área Útil", FieldType.NUMBER, section="dimensions", order=1, unit="m²"),
    field("land_area", "Área do Terreno", FieldType.NUMBER, section="dimensions", order=2, unit="m²"),
    field("gross_area", "Área Bruta", FieldType.NUMBER, section="dimensions", order=3, unit="m²"),
    
    # Características
    field("bedrooms", "Quartos", FieldType.NUMBER, section="features", order=1, min_value=0),
    field("bathrooms", "Casas de Banho", FieldType.NUMBER, section="features", order=2, min_value=0),
    field("parking_spaces", "Estacionamentos", FieldType.NUMBER, section="features", order=3, min_value=0),
    field("floor", "Andar", FieldType.NUMBER, section="features", order=4),
    field("has_elevator", "Elevador", FieldType.CHECKBOX, section="features", order=5),
    field("has_garage", "Garagem", FieldType.CHECKBOX, section="features", order=6),
    field("has_pool", "Piscina", FieldType.CHECKBOX, section="features", order=7),
    field("has_garden", "Jardim", FieldType.CHECKBOX, section="features", order=8),
    field("has_terrace", "Terraço", FieldType.CHECKBOX, section="features", order=9),
    field("has_balcony", "Varanda", FieldType.CHECKBOX, section="features", order=10),
    
    # Estado
    field("condition", "Estado do Imóvel", FieldType.SELECT, section="condition", order=1, options=[
        {"value": "new", "label": "Novo"},
        {"value": "used", "label": "Usado"},
        {"value": "under_construction", "label": "Em Construção"},
        {"value": "to_recover", "label": "Para Recuperar"},
        {"value": "renovated", "label": "Renovado"},
    ]),
    field("construction_year", "Ano de Construção", FieldType.NUMBER, section="condition", order=2),
    field("energy_certificate", "Certificado Energético", FieldType.SELECT, section="condition", order=3, options=[
        {"value": "A+", "label": "A+"},
        {"value": "A", "label": "A"},
        {"value": "B", "label": "B"},
        {"value": "B-", "label": "B-"},
        {"value": "C", "label": "C"},
        {"value": "D", "label": "D"},
        {"value": "E", "label": "E"},
        {"value": "F", "label": "F"},
        {"value": "exempt", "label": "Isento"},
        {"value": "pending", "label": "Em Curso"},
    ]),
    
    # Localização
    field("district", "Distrito", FieldType.SELECT, required=True, section="location", order=1),
    field("municipality", "Concelho", FieldType.SELECT, required=True, section="location", order=2, depends_on="district"),
    field("parish", "Freguesia", FieldType.SELECT, section="location", order=3, depends_on="municipality"),
    field("address", "Morada", FieldType.TEXT, section="location", order=4),
    field("postal_code", "Código Postal", FieldType.TEXT, section="location", order=5),
    field("latitude", "Latitude", FieldType.NUMBER, section="location", order=6),
    field("longitude", "Longitude", FieldType.NUMBER, section="location", order=7),
]


# ===========================================
# AUTOMÓVEL
# ===========================================

# Marcas de carros populares em Portugal
CAR_BRANDS = [
    {"value": "audi", "label": "Audi"},
    {"value": "bmw", "label": "BMW"},
    {"value": "citroen", "label": "Citroën"},
    {"value": "dacia", "label": "Dacia"},
    {"value": "fiat", "label": "Fiat"},
    {"value": "ford", "label": "Ford"},
    {"value": "honda", "label": "Honda"},
    {"value": "hyundai", "label": "Hyundai"},
    {"value": "kia", "label": "Kia"},
    {"value": "mazda", "label": "Mazda"},
    {"value": "mercedes", "label": "Mercedes-Benz"},
    {"value": "nissan", "label": "Nissan"},
    {"value": "opel", "label": "Opel"},
    {"value": "peugeot", "label": "Peugeot"},
    {"value": "porsche", "label": "Porsche"},
    {"value": "renault", "label": "Renault"},
    {"value": "seat", "label": "SEAT"},
    {"value": "skoda", "label": "Škoda"},
    {"value": "tesla", "label": "Tesla"},
    {"value": "toyota", "label": "Toyota"},
    {"value": "volkswagen", "label": "Volkswagen"},
    {"value": "volvo", "label": "Volvo"},
    {"value": "other", "label": "Outra"},
]

AUTOMOTIVE_FIELDS = [
    # Identificação do veículo
    field("brand", "Marca", FieldType.SELECT, required=True, section="identification", order=3, options=CAR_BRANDS),
    field("model", "Modelo", FieldType.TEXT, required=True, section="identification", order=4,
          placeholder="Ex: Golf, Clio, Série 3..."),
    field("version", "Versão", FieldType.TEXT, section="identification", order=5,
          placeholder="Ex: GTI, RS, AMG Line..."),
    field("license_plate", "Matrícula", FieldType.TEXT, section="identification", order=6,
          api_field="reference", placeholder="XX-XX-XX"),
    
    # Tipo de negócio
    field("business_type", "Tipo de Negócio", FieldType.SELECT, required=True, section="type", order=1, options=[
        {"value": "sale", "label": "Venda"},
        {"value": "trade_in", "label": "Retoma"},
        {"value": "leasing", "label": "Leasing"},
        {"value": "renting", "label": "Renting"},
    ]),
    field("vehicle_type", "Tipo de Veículo", FieldType.SELECT, required=True, section="type", order=2, 
          api_field="property_type", options=[
        {"value": "ligeiro", "label": "Ligeiro Passageiros"},
        {"value": "suv", "label": "SUV / Crossover"},
        {"value": "comercial", "label": "Comercial / Utilitário"},
        {"value": "mota", "label": "Mota"},
        {"value": "classico", "label": "Clássico"},
        {"value": "eletrico", "label": "Elétrico"},
        {"value": "hibrido", "label": "Híbrido"},
        {"value": "carrinha", "label": "Carrinha"},
        {"value": "cabrio", "label": "Cabrio"},
        {"value": "coupe", "label": "Coupé"},
        {"value": "monovolume", "label": "Monovolume"},
    ]),
    
    # Especificações técnicas
    field("year", "Ano", FieldType.NUMBER, required=True, section="specs", order=1, 
          min_value=1900, max_value=2030),
    field("month", "Mês de Registo", FieldType.SELECT, section="specs", order=2, options=[
        {"value": "1", "label": "Janeiro"}, {"value": "2", "label": "Fevereiro"},
        {"value": "3", "label": "Março"}, {"value": "4", "label": "Abril"},
        {"value": "5", "label": "Maio"}, {"value": "6", "label": "Junho"},
        {"value": "7", "label": "Julho"}, {"value": "8", "label": "Agosto"},
        {"value": "9", "label": "Setembro"}, {"value": "10", "label": "Outubro"},
        {"value": "11", "label": "Novembro"}, {"value": "12", "label": "Dezembro"},
    ]),
    field("mileage", "Quilometragem", FieldType.NUMBER, required=True, section="specs", order=3, 
          unit="km", api_field="usable_area"),
    field("fuel_type", "Combustível", FieldType.SELECT, required=True, section="specs", order=4, options=[
        {"value": "gasoline", "label": "Gasolina"},
        {"value": "diesel", "label": "Diesel"},
        {"value": "electric", "label": "Elétrico"},
        {"value": "hybrid", "label": "Híbrido"},
        {"value": "hybrid_plugin", "label": "Híbrido Plug-in"},
        {"value": "lpg", "label": "GPL"},
        {"value": "cng", "label": "GNC"},
    ]),
    field("transmission", "Transmissão", FieldType.SELECT, section="specs", order=5, options=[
        {"value": "manual", "label": "Manual"},
        {"value": "automatic", "label": "Automática"},
        {"value": "semi_automatic", "label": "Semi-automática"},
        {"value": "cvt", "label": "CVT"},
    ]),
    field("engine_size", "Cilindrada", FieldType.NUMBER, section="specs", order=6, unit="cc"),
    field("power_hp", "Potência", FieldType.NUMBER, section="specs", order=7, unit="cv"),
    field("power_kw", "Potência (kW)", FieldType.NUMBER, section="specs", order=8, unit="kW"),
    field("doors", "Portas", FieldType.SELECT, section="specs", order=9, options=[
        {"value": "2", "label": "2"},
        {"value": "3", "label": "3"},
        {"value": "4", "label": "4"},
        {"value": "5", "label": "5"},
    ]),
    field("seats", "Lugares", FieldType.NUMBER, section="specs", order=10, min_value=1, max_value=9),
    field("color_exterior", "Cor Exterior", FieldType.TEXT, section="specs", order=11),
    field("color_interior", "Cor Interior", FieldType.TEXT, section="specs", order=12),
    
    # Estado e histórico
    field("condition", "Estado", FieldType.SELECT, section="condition", order=1, options=[
        {"value": "new", "label": "Novo"},
        {"value": "semi_new", "label": "Semi-novo"},
        {"value": "used", "label": "Usado"},
        {"value": "damaged", "label": "Acidentado"},
        {"value": "salvage", "label": "Para Peças"},
    ]),
    field("owners_count", "Nº de Donos", FieldType.NUMBER, section="condition", order=2, min_value=1),
    field("service_book", "Livro de Revisões", FieldType.CHECKBOX, section="condition", order=3),
    field("non_smoker", "Não Fumador", FieldType.CHECKBOX, section="condition", order=4),
    field("imported", "Importado", FieldType.CHECKBOX, section="condition", order=5),
    field("warranty", "Garantia", FieldType.SELECT, section="condition", order=6, options=[
        {"value": "none", "label": "Sem garantia"},
        {"value": "3_months", "label": "3 meses"},
        {"value": "6_months", "label": "6 meses"},
        {"value": "12_months", "label": "12 meses"},
        {"value": "24_months", "label": "24 meses"},
        {"value": "factory", "label": "Garantia de fábrica"},
    ]),
    field("iuc", "IUC Anual", FieldType.CURRENCY, section="condition", order=7, help_text="Imposto Único de Circulação"),
    field("inspection_date", "Próxima Inspeção", FieldType.DATE, section="condition", order=8),
    
    # Emissões
    field("emission_class", "Classe de Emissões", FieldType.SELECT, section="emissions", order=1, 
          api_field="energy_certificate", options=[
        {"value": "euro6d", "label": "Euro 6d"},
        {"value": "euro6", "label": "Euro 6"},
        {"value": "euro5", "label": "Euro 5"},
        {"value": "euro4", "label": "Euro 4"},
        {"value": "euro3", "label": "Euro 3"},
        {"value": "zero", "label": "Zero Emissões"},
    ]),
    field("co2_emissions", "Emissões CO2", FieldType.NUMBER, section="emissions", order=2, unit="g/km"),
    field("consumption_city", "Consumo Urbano", FieldType.NUMBER, section="emissions", order=3, unit="l/100km"),
    field("consumption_highway", "Consumo Extra-urbano", FieldType.NUMBER, section="emissions", order=4, unit="l/100km"),
    field("consumption_combined", "Consumo Combinado", FieldType.NUMBER, section="emissions", order=5, unit="l/100km"),
    
    # Equipamento
    field("has_gps", "GPS", FieldType.CHECKBOX, section="equipment", order=1),
    field("has_bluetooth", "Bluetooth", FieldType.CHECKBOX, section="equipment", order=2),
    field("has_parking_sensors", "Sensores de Estacionamento", FieldType.CHECKBOX, section="equipment", order=3),
    field("has_rear_camera", "Câmara Traseira", FieldType.CHECKBOX, section="equipment", order=4),
    field("has_360_camera", "Câmara 360°", FieldType.CHECKBOX, section="equipment", order=5),
    field("has_cruise_control", "Cruise Control", FieldType.CHECKBOX, section="equipment", order=6),
    field("has_adaptive_cruise", "Cruise Control Adaptativo", FieldType.CHECKBOX, section="equipment", order=7),
    field("has_leather_seats", "Estofos em Pele", FieldType.CHECKBOX, section="equipment", order=8),
    field("has_heated_seats", "Bancos Aquecidos", FieldType.CHECKBOX, section="equipment", order=9),
    field("has_ventilated_seats", "Bancos Ventilados", FieldType.CHECKBOX, section="equipment", order=10),
    field("has_sunroof", "Teto de Abrir", FieldType.CHECKBOX, section="equipment", order=11),
    field("has_panoramic_roof", "Teto Panorâmico", FieldType.CHECKBOX, section="equipment", order=12),
    field("has_led_lights", "Faróis LED", FieldType.CHECKBOX, section="equipment", order=13),
    field("has_xenon_lights", "Faróis Xénon", FieldType.CHECKBOX, section="equipment", order=14),
    field("has_apple_carplay", "Apple CarPlay", FieldType.CHECKBOX, section="equipment", order=15),
    field("has_android_auto", "Android Auto", FieldType.CHECKBOX, section="equipment", order=16),
    field("has_keyless_entry", "Entrada sem Chave", FieldType.CHECKBOX, section="equipment", order=17),
    field("has_start_button", "Botão Start/Stop", FieldType.CHECKBOX, section="equipment", order=18),
    field("has_lane_assist", "Assistente de Faixa", FieldType.CHECKBOX, section="equipment", order=19),
    field("has_blind_spot", "Deteção Ângulo Morto", FieldType.CHECKBOX, section="equipment", order=20),
    
    # Localização
    field("location", "Localização", FieldType.TEXT, section="location", order=1),
]


# ===========================================
# SERVIÇOS
# ===========================================

SERVICES_FIELDS = [
    # Tipo de serviço
    field("service_type", "Tipo de Serviço", FieldType.SELECT, required=True, section="type", order=1, 
          api_field="property_type", options=[
        {"value": "consultoria", "label": "Consultoria"},
        {"value": "formacao", "label": "Formação"},
        {"value": "marketing", "label": "Marketing"},
        {"value": "it", "label": "IT / Tecnologia"},
        {"value": "contabilidade", "label": "Contabilidade"},
        {"value": "juridico", "label": "Jurídico"},
        {"value": "design", "label": "Design"},
        {"value": "manutencao", "label": "Manutenção"},
        {"value": "outro", "label": "Outro"},
    ]),
    field("contract_type", "Tipo de Contrato", FieldType.SELECT, section="type", order=2, 
          api_field="business_type", options=[
        {"value": "project", "label": "Por Projeto"},
        {"value": "retainer", "label": "Avença Mensal"},
        {"value": "hourly", "label": "Por Hora"},
        {"value": "daily", "label": "Por Dia"},
    ]),
    
    # Detalhes do serviço
    field("duration", "Duração Estimada", FieldType.TEXT, section="details", order=1,
          placeholder="Ex: 2 semanas, 3 meses, etc."),
    field("delivery_time", "Prazo de Entrega", FieldType.TEXT, section="details", order=2),
    field("min_contract", "Contrato Mínimo", FieldType.TEXT, section="details", order=3,
          placeholder="Ex: 3 meses"),
    
    # Incluído no serviço
    field("includes_materials", "Inclui Materiais", FieldType.CHECKBOX, section="includes", order=1),
    field("includes_support", "Inclui Suporte", FieldType.CHECKBOX, section="includes", order=2),
    field("includes_training", "Inclui Formação", FieldType.CHECKBOX, section="includes", order=3),
    field("includes_warranty", "Inclui Garantia", FieldType.CHECKBOX, section="includes", order=4),
    
    # Disponibilidade
    field("availability", "Disponibilidade", FieldType.SELECT, section="availability", order=1, options=[
        {"value": "immediate", "label": "Imediata"},
        {"value": "1_week", "label": "1 Semana"},
        {"value": "2_weeks", "label": "2 Semanas"},
        {"value": "1_month", "label": "1 Mês"},
        {"value": "schedule", "label": "A Agendar"},
    ]),
    field("remote_available", "Disponível Remotamente", FieldType.CHECKBOX, section="availability", order=2),
    field("onsite_available", "Disponível Presencialmente", FieldType.CHECKBOX, section="availability", order=3),
    
    # Localização
    field("service_area", "Área de Cobertura", FieldType.TEXT, section="location", order=1,
          placeholder="Ex: Grande Lisboa, Nacional, etc."),
]


# ===========================================
# RETALHO
# ===========================================

RETAIL_FIELDS = [
    # Identificação do produto
    field("sku", "SKU", FieldType.TEXT, section="identification", order=3, api_field="reference"),
    field("barcode", "Código de Barras", FieldType.TEXT, section="identification", order=4),
    field("brand", "Marca", FieldType.TEXT, section="identification", order=5),
    
    # Categoria
    field("category", "Categoria", FieldType.SELECT, required=True, section="type", order=1, 
          api_field="property_type", options=[
        {"value": "eletronica", "label": "Eletrónica"},
        {"value": "moda", "label": "Moda"},
        {"value": "casa", "label": "Casa & Decoração"},
        {"value": "desporto", "label": "Desporto"},
        {"value": "alimentar", "label": "Alimentar"},
        {"value": "saude", "label": "Saúde & Beleza"},
        {"value": "brinquedos", "label": "Brinquedos"},
        {"value": "outro", "label": "Outro"},
    ]),
    
    # Stock e preços
    field("stock_quantity", "Quantidade em Stock", FieldType.NUMBER, section="stock", order=1, min_value=0),
    field("min_stock", "Stock Mínimo", FieldType.NUMBER, section="stock", order=2, min_value=0),
    field("cost_price", "Preço de Custo", FieldType.CURRENCY, section="pricing", order=2),
    field("compare_price", "Preço Comparativo", FieldType.CURRENCY, section="pricing", order=3,
          help_text="Preço anterior (para mostrar desconto)"),
    
    # Dimensões
    field("weight", "Peso", FieldType.NUMBER, section="dimensions", order=1, unit="kg"),
    field("width", "Largura", FieldType.NUMBER, section="dimensions", order=2, unit="cm"),
    field("height", "Altura", FieldType.NUMBER, section="dimensions", order=3, unit="cm"),
    field("depth", "Profundidade", FieldType.NUMBER, section="dimensions", order=4, unit="cm"),
    
    # Estado
    field("condition", "Estado", FieldType.SELECT, section="condition", order=1, options=[
        {"value": "new", "label": "Novo"},
        {"value": "refurbished", "label": "Recondicionado"},
        {"value": "used", "label": "Usado"},
        {"value": "damaged", "label": "Com Defeito"},
    ]),
    field("warranty_months", "Garantia (meses)", FieldType.NUMBER, section="condition", order=2),
]


# ===========================================
# HOTELARIA
# ===========================================

HOSPITALITY_FIELDS = [
    # Tipo de alojamento
    field("room_type", "Tipo de Quarto", FieldType.SELECT, required=True, section="type", order=1, 
          api_field="property_type", options=[
        {"value": "single", "label": "Single"},
        {"value": "double", "label": "Duplo"},
        {"value": "twin", "label": "Twin"},
        {"value": "triple", "label": "Triplo"},
        {"value": "family", "label": "Familiar"},
        {"value": "suite", "label": "Suite"},
        {"value": "suite_junior", "label": "Suite Júnior"},
        {"value": "presidential", "label": "Suite Presidencial"},
        {"value": "apartment", "label": "Apartamento"},
        {"value": "villa", "label": "Villa"},
    ]),
    field("board_type", "Regime", FieldType.SELECT, section="type", order=2, api_field="business_type", options=[
        {"value": "room_only", "label": "Só Alojamento"},
        {"value": "bb", "label": "Alojamento + Pequeno-almoço"},
        {"value": "hb", "label": "Meia Pensão"},
        {"value": "fb", "label": "Pensão Completa"},
        {"value": "ai", "label": "Tudo Incluído"},
    ]),
    
    # Capacidade
    field("max_guests", "Capacidade Máxima", FieldType.NUMBER, required=True, section="capacity", order=1),
    field("bedrooms", "Quartos", FieldType.NUMBER, section="capacity", order=2),
    field("beds", "Camas", FieldType.NUMBER, section="capacity", order=3),
    field("bathrooms", "Casas de Banho", FieldType.NUMBER, section="capacity", order=4),
    field("area", "Área", FieldType.NUMBER, section="capacity", order=5, unit="m²", api_field="usable_area"),
    
    # Comodidades
    field("has_wifi", "Wi-Fi", FieldType.CHECKBOX, section="amenities", order=1),
    field("has_ac", "Ar Condicionado", FieldType.CHECKBOX, section="amenities", order=2),
    field("has_heating", "Aquecimento", FieldType.CHECKBOX, section="amenities", order=3),
    field("has_tv", "TV", FieldType.CHECKBOX, section="amenities", order=4),
    field("has_minibar", "Minibar", FieldType.CHECKBOX, section="amenities", order=5),
    field("has_safe", "Cofre", FieldType.CHECKBOX, section="amenities", order=6),
    field("has_balcony", "Varanda", FieldType.CHECKBOX, section="amenities", order=7),
    field("has_sea_view", "Vista Mar", FieldType.CHECKBOX, section="amenities", order=8),
    field("has_pool_view", "Vista Piscina", FieldType.CHECKBOX, section="amenities", order=9),
    field("has_kitchen", "Kitchenette", FieldType.CHECKBOX, section="amenities", order=10),
    field("has_jacuzzi", "Jacuzzi", FieldType.CHECKBOX, section="amenities", order=11),
    
    # Políticas
    field("check_in_time", "Hora Check-in", FieldType.TEXT, section="policies", order=1, placeholder="14:00"),
    field("check_out_time", "Hora Check-out", FieldType.TEXT, section="policies", order=2, placeholder="11:00"),
    field("allows_pets", "Permite Animais", FieldType.CHECKBOX, section="policies", order=3),
    field("allows_smoking", "Permite Fumar", FieldType.CHECKBOX, section="policies", order=4),
    field("min_nights", "Mínimo de Noites", FieldType.NUMBER, section="policies", order=5, min_value=1),
]


# ===========================================
# GENÉRICO
# ===========================================

GENERIC_FIELDS = [
    field("category", "Categoria", FieldType.SELECT, section="type", order=1, api_field="property_type", options=[
        {"value": "produto", "label": "Produto"},
        {"value": "servico", "label": "Serviço"},
        {"value": "outro", "label": "Outro"},
    ]),
    field("quantity", "Quantidade", FieldType.NUMBER, section="details", order=1),
    field("unit", "Unidade", FieldType.TEXT, section="details", order=2),
    field("condition", "Estado", FieldType.SELECT, section="condition", order=1, options=[
        {"value": "new", "label": "Novo"},
        {"value": "used", "label": "Usado"},
    ]),
    field("location", "Localização", FieldType.TEXT, section="location", order=1),
]


# ===========================================
# SEÇÕES POR SETOR
# ===========================================

SECTOR_SECTIONS = {
    "real_estate": [
        {"key": "identification", "label": "Identificação", "icon": "tag"},
        {"key": "type", "label": "Tipo de Negócio", "icon": "home"},
        {"key": "pricing", "label": "Preço", "icon": "currency"},
        {"key": "dimensions", "label": "Áreas", "icon": "ruler"},
        {"key": "features", "label": "Características", "icon": "list"},
        {"key": "condition", "label": "Estado", "icon": "clipboard"},
        {"key": "location", "label": "Localização", "icon": "map"},
        {"key": "description", "label": "Descrição", "icon": "text"},
        {"key": "status", "label": "Publicação", "icon": "eye"},
    ],
    "automotive": [
        {"key": "identification", "label": "Identificação", "icon": "car"},
        {"key": "type", "label": "Tipo de Negócio", "icon": "tag"},
        {"key": "pricing", "label": "Preço", "icon": "currency"},
        {"key": "specs", "label": "Especificações", "icon": "settings"},
        {"key": "condition", "label": "Estado e Histórico", "icon": "clipboard"},
        {"key": "emissions", "label": "Emissões e Consumos", "icon": "leaf"},
        {"key": "equipment", "label": "Equipamento", "icon": "list"},
        {"key": "location", "label": "Localização", "icon": "map"},
        {"key": "description", "label": "Descrição", "icon": "text"},
        {"key": "status", "label": "Publicação", "icon": "eye"},
    ],
    "services": [
        {"key": "identification", "label": "Identificação", "icon": "briefcase"},
        {"key": "type", "label": "Tipo de Serviço", "icon": "tag"},
        {"key": "pricing", "label": "Preço", "icon": "currency"},
        {"key": "details", "label": "Detalhes", "icon": "list"},
        {"key": "includes", "label": "Incluído", "icon": "check"},
        {"key": "availability", "label": "Disponibilidade", "icon": "calendar"},
        {"key": "location", "label": "Área de Cobertura", "icon": "map"},
        {"key": "description", "label": "Descrição", "icon": "text"},
        {"key": "status", "label": "Publicação", "icon": "eye"},
    ],
    "retail": [
        {"key": "identification", "label": "Identificação", "icon": "box"},
        {"key": "type", "label": "Categoria", "icon": "tag"},
        {"key": "pricing", "label": "Preços", "icon": "currency"},
        {"key": "stock", "label": "Stock", "icon": "package"},
        {"key": "dimensions", "label": "Dimensões", "icon": "ruler"},
        {"key": "condition", "label": "Estado", "icon": "clipboard"},
        {"key": "description", "label": "Descrição", "icon": "text"},
        {"key": "status", "label": "Publicação", "icon": "eye"},
    ],
    "hospitality": [
        {"key": "identification", "label": "Identificação", "icon": "bed"},
        {"key": "type", "label": "Tipo de Alojamento", "icon": "tag"},
        {"key": "pricing", "label": "Preço", "icon": "currency"},
        {"key": "capacity", "label": "Capacidade", "icon": "users"},
        {"key": "amenities", "label": "Comodidades", "icon": "list"},
        {"key": "policies", "label": "Políticas", "icon": "clipboard"},
        {"key": "description", "label": "Descrição", "icon": "text"},
        {"key": "status", "label": "Publicação", "icon": "eye"},
    ],
    "other": [
        {"key": "identification", "label": "Identificação", "icon": "tag"},
        {"key": "type", "label": "Tipo", "icon": "folder"},
        {"key": "pricing", "label": "Preço", "icon": "currency"},
        {"key": "details", "label": "Detalhes", "icon": "list"},
        {"key": "condition", "label": "Estado", "icon": "clipboard"},
        {"key": "location", "label": "Localização", "icon": "map"},
        {"key": "description", "label": "Descrição", "icon": "text"},
        {"key": "status", "label": "Publicação", "icon": "eye"},
    ],
}


# ===========================================
# MAPEAMENTO DE SETORES
# ===========================================

SECTOR_FIELDS_MAP = {
    "real_estate": COMMON_FIELDS + REAL_ESTATE_FIELDS,
    "automotive": COMMON_FIELDS + AUTOMOTIVE_FIELDS,
    "services": COMMON_FIELDS + SERVICES_FIELDS,
    "retail": COMMON_FIELDS + RETAIL_FIELDS,
    "hospitality": COMMON_FIELDS + HOSPITALITY_FIELDS,
    "other": COMMON_FIELDS + GENERIC_FIELDS,
}


def get_sector_fields(sector: str) -> List[Dict[str, Any]]:
    """
    Retorna os campos de formulário para um setor específico.
    """
    return SECTOR_FIELDS_MAP.get(sector, SECTOR_FIELDS_MAP["other"])


def get_sector_sections(sector: str) -> List[Dict[str, str]]:
    """
    Retorna as seções do formulário para um setor específico.
    """
    return SECTOR_SECTIONS.get(sector, SECTOR_SECTIONS["other"])


def get_form_config(sector: str) -> Dict[str, Any]:
    """
    Retorna configuração completa do formulário para um setor.
    """
    fields = get_sector_fields(sector)
    sections = get_sector_sections(sector)
    
    # Organizar campos por seção
    fields_by_section = {}
    for section in sections:
        section_fields = [f for f in fields if f["section"] == section["key"]]
        section_fields.sort(key=lambda x: x["order"])
        fields_by_section[section["key"]] = section_fields
    
    return {
        "sector": sector,
        "sections": sections,
        "fields": fields,
        "fields_by_section": fields_by_section,
    }
