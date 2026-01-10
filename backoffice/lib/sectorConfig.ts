/**
 * Configurações específicas por sector de actividade
 * Este ficheiro centraliza todas as constantes que variam por sector
 */

export type Sector = 'real_estate' | 'automotive' | 'boats' | 'machinery' | 'services' | 'retail' | 'hospitality';

// Tipos de propriedade/item por sector
export const PROPERTY_TYPES: Record<Sector, string[]> = {
  real_estate: [
    "Apartamento",
    "Moradia",
    "Terreno",
    "Loja",
    "Escritório",
    "Armazém",
    "Prédio",
    "Quinta",
    "Garagem",
  ],
  automotive: [
    "Ligeiro Passageiros",
    "SUV",
    "Comercial",
    "Monovolume",
    "Carrinha",
    "Coupé",
    "Cabrio",
    "Pick-up",
    "Moto",
    "Clássico",
  ],
  boats: [
    "Veleiro",
    "Lancha",
    "Iate",
    "Catamaran",
    "Moto de Água",
    "Barco de Pesca",
    "Semi-rígido",
  ],
  machinery: [
    "Escavadora",
    "Retroescavadora",
    "Empilhador",
    "Trator",
    "Grua",
    "Compressor",
    "Gerador",
  ],
  services: ["Serviço"],
  retail: ["Produto"],
  hospitality: ["Quarto", "Suite", "Apartamento", "Villa"],
};

// Tipos de negócio por sector
export const BUSINESS_TYPES: Record<Sector, string[]> = {
  real_estate: ["Venda", "Arrendamento", "Trespasse"],
  automotive: ["Venda", "Aluguer", "Retoma", "Leasing"],
  boats: ["Venda", "Aluguer", "Charter"],
  machinery: ["Venda", "Aluguer", "Leasing"],
  services: ["Prestação"],
  retail: ["Venda"],
  hospitality: ["Reserva", "Aluguer"],
};

// Tipologias por sector
export const TYPOLOGIES: Record<Sector, string[]> = {
  real_estate: ["T0", "T1", "T2", "T3", "T4", "T5+", "Loft", "Duplex"],
  automotive: ["Citadino", "Compacto", "Familiar", "Executivo", "Desportivo", "Luxo", "Todo-o-Terreno"],
  boats: ["Até 6m", "6-10m", "10-15m", "15-20m", "20m+"],
  machinery: ["Pequeno", "Médio", "Grande", "Industrial"],
  services: [],
  retail: [],
  hospitality: ["Standard", "Superior", "Deluxe", "Suite", "Presidencial"],
};

// Condições/Estados por sector
export const CONDITIONS: Record<Sector, string[]> = {
  real_estate: ["Novo", "Usado", "Renovado", "Para Recuperar", "Em Construção"],
  automotive: ["Novo", "Semi-novo", "Usado", "Clássico", "Para Peças"],
  boats: ["Novo", "Semi-novo", "Usado", "Restaurado"],
  machinery: ["Novo", "Recondicionado", "Usado", "Para Peças"],
  services: [],
  retail: ["Novo", "Usado", "Recondicionado"],
  hospitality: [],
};

// Características/Features por sector
export const FEATURES: Record<Sector, string[]> = {
  real_estate: [
    "Varanda", "Terraço", "Jardim", "Piscina", "Garagem", "Arrecadação",
    "Elevador", "Portaria", "Ar Condicionado", "Aquecimento Central",
    "Lareira", "Suite", "Vista Mar", "Vista Rio",
  ],
  automotive: [
    "Ar Condicionado", "GPS", "Bluetooth", "Sensores Estacionamento",
    "Câmara Traseira", "Teto de Abrir", "Bancos Aquecidos",
    "Cruise Control", "Start/Stop", "Faróis LED", "Jantes Liga Leve",
  ],
  boats: [
    "GPS", "Radar", "Piloto Automático", "Gerador", "Ar Condicionado",
    "Equipamento de Pesca", "Tender", "Jet Ski",
  ],
  machinery: [
    "Cabine Fechada", "Ar Condicionado", "GPS", "Sistema Hidráulico",
    "Acessórios Incluídos",
  ],
  services: [],
  retail: [],
  hospitality: [
    "Vista Mar", "Varanda", "Mini-bar", "Cofre", "TV", "WiFi",
    "Room Service", "Jacuzzi",
  ],
};

// Labels para campos específicos por sector
export const FIELD_LABELS: Record<Sector, Record<string, string>> = {
  real_estate: {
    reference: "Referência",
    area: "Área Útil",
    area_unit: "m²",
    area_gross: "Área Bruta",
    area_land: "Área Terreno",
    typology: "Tipologia",
    bedrooms: "Quartos",
    bathrooms: "Casas de Banho",
    property_type: "Tipo de Imóvel",
    business_type: "Tipo de Negócio",
    condition: "Estado",
    energy_cert: "Certificado Energético",
    floor: "Piso",
    year_built: "Ano de Construção",
  },
  automotive: {
    reference: "Matrícula",
    area: "Quilometragem",
    area_unit: "km",
    typology: "Segmento",
    property_type: "Tipo de Veículo",
    business_type: "Tipo de Negócio",
    condition: "Estado",
    brand: "Marca",
    model: "Modelo",
    year_built: "Ano",
    fuel: "Combustível",
    transmission: "Transmissão",
    power: "Potência",
    power_unit: "cv",
    engine: "Cilindrada",
    doors: "Portas",
    seats: "Lugares",
    color: "Cor",
    energy_cert: "Classe Emissões",
  },
  boats: {
    reference: "Registo",
    area: "Comprimento",
    area_unit: "m",
    typology: "Categoria",
    property_type: "Tipo de Embarcação",
    business_type: "Tipo de Negócio",
    condition: "Estado",
    brand: "Estaleiro",
    model: "Modelo",
    year_built: "Ano",
    fuel: "Motorização",
    power: "Potência",
    power_unit: "cv",
  },
  machinery: {
    reference: "Referência",
    area: "Horas de Uso",
    area_unit: "h",
    typology: "Categoria",
    property_type: "Tipo de Equipamento",
    business_type: "Tipo de Negócio",
    condition: "Estado",
    brand: "Marca",
    model: "Modelo",
    year_built: "Ano",
    power: "Potência",
  },
  services: {
    reference: "Referência",
    property_type: "Tipo de Serviço",
    business_type: "Modalidade",
  },
  retail: {
    reference: "SKU",
    property_type: "Categoria",
    business_type: "Tipo",
    condition: "Estado",
    brand: "Marca",
  },
  hospitality: {
    reference: "Código",
    area: "Área",
    area_unit: "m²",
    typology: "Categoria",
    property_type: "Tipo de Alojamento",
    business_type: "Tipo de Reserva",
    bedrooms: "Quartos",
    bathrooms: "Casas de Banho",
  },
};

// Placeholders para campos por sector
export const FIELD_PLACEHOLDERS: Record<Sector, Record<string, string>> = {
  real_estate: {
    title: "Ex: Apartamento T2 em Leiria",
    reference: "Ex: REF-12345",
    description: "Descrição detalhada do imóvel para o site...",
    area: "Ex: 120",
    price: "Ex: 250000",
  },
  automotive: {
    title: "Ex: BMW X3 2.0d 2024",
    reference: "Ex: AA-00-AA",
    description: "Descrição detalhada do veículo para o site...",
    area: "Ex: 45000",
    price: "Ex: 35000",
  },
  boats: {
    title: "Ex: Beneteau Oceanis 38.1",
    reference: "Ex: PT-LX-1234",
    description: "Descrição detalhada da embarcação...",
    area: "Ex: 11.5",
    price: "Ex: 180000",
  },
  machinery: {
    title: "Ex: Caterpillar 320D",
    reference: "Ex: CAT-2024-001",
    description: "Descrição detalhada do equipamento...",
    area: "Ex: 3500",
    price: "Ex: 95000",
  },
  services: {
    title: "Ex: Consultoria Empresarial",
    reference: "Ex: SRV-001",
    description: "Descrição do serviço...",
    price: "Ex: 500",
  },
  retail: {
    title: "Ex: iPhone 15 Pro",
    reference: "Ex: SKU-12345",
    description: "Descrição do produto...",
    price: "Ex: 1299",
  },
  hospitality: {
    title: "Ex: Suite Presidencial",
    reference: "Ex: ROOM-101",
    description: "Descrição do alojamento...",
    area: "Ex: 45",
    price: "Ex: 250",
  },
};

// Helper function para obter config do sector
export function getSectorConfig(sector: string) {
  const s = (sector || 'real_estate') as Sector;
  return {
    propertyTypes: PROPERTY_TYPES[s] || PROPERTY_TYPES.real_estate,
    businessTypes: BUSINESS_TYPES[s] || BUSINESS_TYPES.real_estate,
    typologies: TYPOLOGIES[s] || TYPOLOGIES.real_estate,
    conditions: CONDITIONS[s] || CONDITIONS.real_estate,
    features: FEATURES[s] || FEATURES.real_estate,
    labels: FIELD_LABELS[s] || FIELD_LABELS.real_estate,
    placeholders: FIELD_PLACEHOLDERS[s] || FIELD_PLACEHOLDERS.real_estate,
  };
}

// Helper para verificar se um campo deve ser mostrado para um sector
export function shouldShowField(sector: string, fieldName: string): boolean {
  const s = (sector || 'real_estate') as Sector;
  
  // Campos específicos de imobiliário
  const realEstateOnlyFields = ['area_land', 'bedrooms', 'bathrooms', 'floor', 'energy_cert'];
  if (realEstateOnlyFields.includes(fieldName) && s !== 'real_estate' && s !== 'hospitality') {
    return false;
  }
  
  // Campos específicos de automotive
  const automotiveOnlyFields = ['fuel', 'transmission', 'engine', 'doors', 'seats', 'color'];
  if (automotiveOnlyFields.includes(fieldName) && s !== 'automotive') {
    return false;
  }
  
  return true;
}
