/**
 * Terminologia dinâmica baseada no sector do tenant
 * Permite que o mesmo site adapte as palavras ao tipo de negócio
 */

export type Sector = 'real_estate' | 'automotive' | 'retail' | 'services' | 'other';

interface SectorTerms {
  // Entidade principal (imóvel, veículo, produto)
  item: string;
  items: string;
  itemCapital: string;
  itemsCapital: string;
  
  // Agentes/Vendedores
  agent: string;
  agents: string;
  agentCapital: string;
  agentsCapital: string;
  agentRole: string;
  
  // Empreendimentos/Categorias
  development: string;
  developments: string;
  developmentCapital: string;
  developmentsCapital: string;
  
  // Mercado/Indústria
  market: string;
  industry: string;
  
  // Ações
  viewItem: string;
  searchPlaceholder: string;
  noItemsFound: string;
  itemsFound: string;
  featuredItems: string;
  
  // Descrições
  catalogDescription: string;
  teamDescription: string;
  contactDescription: string;
  
  // Menu
  menuItems: string;
  menuDevelopments: string;
  menuTeam: string;
}

const realEstateTerms: SectorTerms = {
  item: 'imóvel',
  items: 'imóveis',
  itemCapital: 'Imóvel',
  itemsCapital: 'Imóveis',
  
  agent: 'agente imobiliário',
  agents: 'agentes imobiliários',
  agentCapital: 'Agente Imobiliário',
  agentsCapital: 'Agentes Imobiliários',
  agentRole: 'Consultor Imobiliário',
  
  development: 'empreendimento',
  developments: 'empreendimentos',
  developmentCapital: 'Empreendimento',
  developmentsCapital: 'Empreendimentos',
  
  market: 'mercado imobiliário',
  industry: 'imobiliário',
  
  viewItem: 'Ver detalhes',
  searchPlaceholder: 'Pesquisar por referência ou localização',
  noItemsFound: 'Nenhum imóvel encontrado',
  itemsFound: 'imóveis encontrados',
  featuredItems: 'Imóveis em destaque',
  
  catalogDescription: 'Explora a montra visual ao estilo catálogo Netflix.',
  teamDescription: 'Conheça os consultores e colaboradores que fazem da nossa agência uma referência no mercado imobiliário.',
  contactDescription: 'Se tem paixão pelo imobiliário, entre em contacto connosco.',
  
  menuItems: 'Imóveis',
  menuDevelopments: 'Empreendimentos',
  menuTeam: 'Equipa',
};

const automotiveTerms: SectorTerms = {
  item: 'veículo',
  items: 'veículos',
  itemCapital: 'Veículo',
  itemsCapital: 'Veículos',
  
  agent: 'comercial',
  agents: 'comerciais',
  agentCapital: 'Comercial',
  agentsCapital: 'Comerciais',
  agentRole: 'Consultor Comercial',
  
  development: 'marca',
  developments: 'marcas',
  developmentCapital: 'Marca',
  developmentsCapital: 'Marcas',
  
  market: 'mercado automóvel',
  industry: 'automóvel',
  
  viewItem: 'Ver detalhes',
  searchPlaceholder: 'Pesquisar por referência ou modelo',
  noItemsFound: 'Nenhum veículo encontrado',
  itemsFound: 'veículos encontrados',
  featuredItems: 'Veículos em destaque',
  
  catalogDescription: 'Explora o nosso catálogo de viaturas.',
  teamDescription: 'Conheça os profissionais que fazem da nossa empresa uma referência no mercado automóvel.',
  contactDescription: 'Se tem paixão por automóveis, entre em contacto connosco.',
  
  menuItems: 'Veículos',
  menuDevelopments: 'Marcas',
  menuTeam: 'Equipa',
};

const retailTerms: SectorTerms = {
  item: 'produto',
  items: 'produtos',
  itemCapital: 'Produto',
  itemsCapital: 'Produtos',
  
  agent: 'vendedor',
  agents: 'vendedores',
  agentCapital: 'Vendedor',
  agentsCapital: 'Vendedores',
  agentRole: 'Consultor de Vendas',
  
  development: 'categoria',
  developments: 'categorias',
  developmentCapital: 'Categoria',
  developmentsCapital: 'Categorias',
  
  market: 'mercado',
  industry: 'retalho',
  
  viewItem: 'Ver detalhes',
  searchPlaceholder: 'Pesquisar produtos',
  noItemsFound: 'Nenhum produto encontrado',
  itemsFound: 'produtos encontrados',
  featuredItems: 'Produtos em destaque',
  
  catalogDescription: 'Explora o nosso catálogo de produtos.',
  teamDescription: 'Conheça a equipa que está sempre pronta para ajudar.',
  contactDescription: 'Entre em contacto connosco.',
  
  menuItems: 'Produtos',
  menuDevelopments: 'Categorias',
  menuTeam: 'Equipa',
};

const defaultTerms: SectorTerms = {
  item: 'item',
  items: 'itens',
  itemCapital: 'Item',
  itemsCapital: 'Itens',
  
  agent: 'colaborador',
  agents: 'colaboradores',
  agentCapital: 'Colaborador',
  agentsCapital: 'Colaboradores',
  agentRole: 'Colaborador',
  
  development: 'categoria',
  developments: 'categorias',
  developmentCapital: 'Categoria',
  developmentsCapital: 'Categorias',
  
  market: 'mercado',
  industry: 'serviços',
  
  viewItem: 'Ver detalhes',
  searchPlaceholder: 'Pesquisar',
  noItemsFound: 'Nenhum resultado encontrado',
  itemsFound: 'resultados encontrados',
  featuredItems: 'Em destaque',
  
  catalogDescription: 'Explore o nosso catálogo.',
  teamDescription: 'Conheça a nossa equipa.',
  contactDescription: 'Entre em contacto connosco.',
  
  menuItems: 'Catálogo',
  menuDevelopments: 'Categorias',
  menuTeam: 'Equipa',
};

const sectorTermsMap: Record<Sector, SectorTerms> = {
  real_estate: realEstateTerms,
  automotive: automotiveTerms,
  retail: retailTerms,
  services: defaultTerms,
  other: defaultTerms,
};

/**
 * Obtém a terminologia para um sector específico
 */
export function getSectorTerms(sector: string | null | undefined): SectorTerms {
  const normalizedSector = (sector || 'real_estate') as Sector;
  return sectorTermsMap[normalizedSector] || realEstateTerms;
}

/**
 * Hook para usar nos componentes React
 */
export function useSectorTerms(sector: string | null | undefined): SectorTerms {
  return getSectorTerms(sector);
}

export type { SectorTerms };
