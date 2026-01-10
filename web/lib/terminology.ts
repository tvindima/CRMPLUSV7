/**
 * Terminologia dinâmica baseada no sector do tenant
 * 
 * Suporta:
 * - real_estate (imobiliário) - default
 * - automotive (automóvel)
 * - boats (náutico)
 * - machinery (maquinaria)
 */

export type Sector = 'real_estate' | 'automotive' | 'boats' | 'machinery';

export interface Terminology {
  // Entidade principal
  item: string;
  items: string;
  itemCapitalized: string;
  itemsCapitalized: string;
  
  // Ações
  findItem: string;
  viewItems: string;
  viewAllItems: string;
  
  // Tipos de negócio
  sale: string;
  rental: string;
  saleOrRental: string;
  
  // Listagens
  newItems: string;
  featuredItems: string;
  premiumItems: string;
  popularItems: string;
  
  // Detalhes
  itemDetails: string;
  itemGallery: string;
  similarItems: string;
  
  // Categorias
  categories: string;
  allCategories: string;
  
  // Filtros
  allTypes: string;
  priceRange: string;
  
  // Páginas
  portfolio: string;
  catalog: string;
  
  // Equipa
  agents: string;
  agentsDescription: string;
  teamTitle: string;
  teamSubtitle: string;
  
  // Formulários
  contactAboutItem: string;
  requestInfo: string;
  scheduleVisit: string;
  
  // Mensagens
  noItemsFound: string;
  searchPlaceholder: string;
  
  // Menu
  menuItems: string;
  menuDevelopments: string;
  menuTeam: string;
  menuContact: string;
}

const realEstateTerms: Terminology = {
  item: 'imóvel',
  items: 'imóveis',
  itemCapitalized: 'Imóvel',
  itemsCapitalized: 'Imóveis',
  
  findItem: 'Encontre o imóvel perfeito',
  viewItems: 'Ver imóveis',
  viewAllItems: 'Ver todos os imóveis',
  
  sale: 'Compra',
  rental: 'Arrendamento',
  saleOrRental: 'Compra / Arrendamento',
  
  newItems: 'Novidades',
  featuredItems: 'Imóveis em destaque',
  premiumItems: 'Imóveis Luxury/Premium',
  popularItems: 'Mais Vistos da Semana',
  
  itemDetails: 'Detalhes do imóvel',
  itemGallery: 'Galeria de fotos',
  similarItems: 'Imóveis semelhantes',
  
  categories: 'Tipologias',
  allCategories: 'Todas as tipologias',
  
  allTypes: 'Todos os tipos',
  priceRange: 'Faixa de preço',
  
  portfolio: 'Portfólio',
  catalog: 'Catálogo de imóveis',
  
  agents: 'Consultores',
  agentsDescription: 'Os nossos agentes imobiliários',
  teamTitle: 'Profissionais dedicados ao seu sucesso',
  teamSubtitle: 'Conheça os consultores e colaboradores que fazem da {agency_name} uma referência no mercado imobiliário. Cada membro da nossa equipa está comprometido em proporcionar-lhe a melhor experiência.',
  
  contactAboutItem: 'Contactar sobre este imóvel',
  requestInfo: 'Pedir informação',
  scheduleVisit: 'Agendar visita',
  
  noItemsFound: 'Nenhum imóvel encontrado',
  searchPlaceholder: 'Pesquisar por referência ou localização',
  
  menuItems: 'Imóveis',
  menuDevelopments: 'Empreendimentos',
  menuTeam: 'Equipa',
  menuContact: 'Contactos',
};

const automotiveTerms: Terminology = {
  item: 'veículo',
  items: 'veículos',
  itemCapitalized: 'Veículo',
  itemsCapitalized: 'Veículos',
  
  findItem: 'Encontre o veículo perfeito',
  viewItems: 'Ver veículos',
  viewAllItems: 'Ver todos os veículos',
  
  sale: 'Venda',
  rental: 'Aluguer',
  saleOrRental: 'Venda / Aluguer',
  
  newItems: 'Novidades',
  featuredItems: 'Veículos em destaque',
  premiumItems: 'Veículos Premium',
  popularItems: 'Mais Vistos da Semana',
  
  itemDetails: 'Detalhes do veículo',
  itemGallery: 'Galeria de fotos',
  similarItems: 'Veículos semelhantes',
  
  categories: 'Categorias',
  allCategories: 'Todas as categorias',
  
  allTypes: 'Todos os tipos',
  priceRange: 'Faixa de preço',
  
  portfolio: 'Stock',
  catalog: 'Catálogo de veículos',
  
  agents: 'Comerciais',
  agentsDescription: 'Os nossos comerciais',
  teamTitle: 'Profissionais dedicados ao seu sucesso',
  teamSubtitle: 'Conheça os comerciais e colaboradores que fazem da {agency_name} uma referência no mercado automóvel. Cada membro da nossa equipa está comprometido em proporcionar-lhe a melhor experiência.',
  
  contactAboutItem: 'Contactar sobre este veículo',
  requestInfo: 'Pedir informação',
  scheduleVisit: 'Agendar test drive',
  
  noItemsFound: 'Nenhum veículo encontrado',
  searchPlaceholder: 'Pesquisar por referência ou marca',
  
  menuItems: 'Veículos',
  menuDevelopments: 'Novidades',
  menuTeam: 'Equipa',
  menuContact: 'Contactos',
};

const boatsTerms: Terminology = {
  item: 'embarcação',
  items: 'embarcações',
  itemCapitalized: 'Embarcação',
  itemsCapitalized: 'Embarcações',
  
  findItem: 'Encontre a embarcação perfeita',
  viewItems: 'Ver embarcações',
  viewAllItems: 'Ver todas as embarcações',
  
  sale: 'Venda',
  rental: 'Charter',
  saleOrRental: 'Venda / Charter',
  
  newItems: 'Novidades',
  featuredItems: 'Embarcações em destaque',
  premiumItems: 'Embarcações Premium',
  popularItems: 'Mais Vistos da Semana',
  
  itemDetails: 'Detalhes da embarcação',
  itemGallery: 'Galeria de fotos',
  similarItems: 'Embarcações semelhantes',
  
  categories: 'Categorias',
  allCategories: 'Todas as categorias',
  
  allTypes: 'Todos os tipos',
  priceRange: 'Faixa de preço',
  
  portfolio: 'Frota',
  catalog: 'Catálogo de embarcações',
  
  agents: 'Consultores',
  agentsDescription: 'Os nossos consultores náuticos',
  teamTitle: 'Profissionais dedicados ao seu sucesso',
  teamSubtitle: 'Conheça os consultores e colaboradores que fazem da {agency_name} uma referência no mercado náutico. Cada membro da nossa equipa está comprometido em proporcionar-lhe a melhor experiência.',
  
  contactAboutItem: 'Contactar sobre esta embarcação',
  requestInfo: 'Pedir informação',
  scheduleVisit: 'Agendar visita',
  
  noItemsFound: 'Nenhuma embarcação encontrada',
  searchPlaceholder: 'Pesquisar por referência ou tipo',
  
  menuItems: 'Embarcações',
  menuDevelopments: 'Novidades',
  menuTeam: 'Equipa',
  menuContact: 'Contactos',
};

const machineryTerms: Terminology = {
  item: 'máquina',
  items: 'máquinas',
  itemCapitalized: 'Máquina',
  itemsCapitalized: 'Máquinas',
  
  findItem: 'Encontre a máquina perfeita',
  viewItems: 'Ver máquinas',
  viewAllItems: 'Ver todas as máquinas',
  
  sale: 'Venda',
  rental: 'Aluguer',
  saleOrRental: 'Venda / Aluguer',
  
  newItems: 'Novidades',
  featuredItems: 'Máquinas em destaque',
  premiumItems: 'Máquinas Premium',
  popularItems: 'Mais Vistos da Semana',
  
  itemDetails: 'Detalhes da máquina',
  itemGallery: 'Galeria de fotos',
  similarItems: 'Máquinas semelhantes',
  
  categories: 'Categorias',
  allCategories: 'Todas as categorias',
  
  allTypes: 'Todos os tipos',
  priceRange: 'Faixa de preço',
  
  portfolio: 'Stock',
  catalog: 'Catálogo de máquinas',
  
  agents: 'Comerciais',
  agentsDescription: 'Os nossos comerciais',
  teamTitle: 'Profissionais dedicados ao seu sucesso',
  teamSubtitle: 'Conheça os comerciais e colaboradores que fazem da {agency_name} uma referência no mercado. Cada membro da nossa equipa está comprometido em proporcionar-lhe a melhor experiência.',
  
  contactAboutItem: 'Contactar sobre esta máquina',
  requestInfo: 'Pedir informação',
  scheduleVisit: 'Agendar demonstração',
  
  noItemsFound: 'Nenhuma máquina encontrada',
  searchPlaceholder: 'Pesquisar por referência ou tipo',
  
  menuItems: 'Máquinas',
  menuDevelopments: 'Novidades',
  menuTeam: 'Equipa',
  menuContact: 'Contactos',
};

const terminologyMap: Record<Sector, Terminology> = {
  real_estate: realEstateTerms,
  automotive: automotiveTerms,
  boats: boatsTerms,
  machinery: machineryTerms,
};

export function getTerminology(sector: Sector = 'real_estate'): Terminology {
  return terminologyMap[sector] || realEstateTerms;
}

export function replaceAgencyName(text: string, agencyName: string): string {
  return text.replace(/{agency_name}/g, agencyName);
}
