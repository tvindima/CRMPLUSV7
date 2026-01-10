'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Terminology {
  // Entidades principais
  item: string;
  items: string;
  item_singular: string;
  item_plural: string;
  inventory: string;
  inventory_description: string;
  
  // Ações
  new_item: string;
  add_item: string;
  edit_item: string;
  view_item: string;
  item_details: string;
  item_list: string;
  
  // Campos
  reference: string;
  area: string;
  area_unit: string;
  price: string;
  location: string;
  typology: string;
  condition: string;
  
  // Transações
  transaction_sale: string;
  transaction_rent: string;
  transaction_types: string;
  
  // Pipeline
  visit: string;
  visits: string;
  schedule_visit: string;
  proposal: string;
  
  // Atores
  client_buyer: string;
  client_seller: string;
  owner: string;
  
  // Outros
  features: string;
  amenities: string;
  
  // Index signature para acesso dinâmico
  [key: string]: string | undefined;
}

// Terminologia padrão (imobiliário)
const DEFAULT_TERMINOLOGY: Terminology = {
  item: 'Imóvel',
  items: 'Imóveis',
  item_singular: 'imóvel',
  item_plural: 'imóveis',
  inventory: 'Carteira',
  inventory_description: 'Carteira de Imóveis',
  new_item: 'Novo Imóvel',
  add_item: 'Adicionar Imóvel',
  edit_item: 'Editar Imóvel',
  view_item: 'Ver Imóvel',
  item_details: 'Detalhes do Imóvel',
  item_list: 'Lista de Imóveis',
  reference: 'Referência',
  area: 'Área',
  area_unit: 'm²',
  price: 'Preço',
  location: 'Localização',
  typology: 'Tipologia',
  condition: 'Estado',
  transaction_sale: 'Venda',
  transaction_rent: 'Arrendamento',
  transaction_types: 'Tipo de Negócio',
  visit: 'Visita',
  visits: 'Visitas',
  schedule_visit: 'Agendar Visita',
  proposal: 'Proposta',
  client_buyer: 'Comprador',
  client_seller: 'Vendedor',
  owner: 'Proprietário',
  features: 'Características',
  amenities: 'Comodidades',
};

interface TerminologyContextType {
  sector: string;
  terminology: Terminology;
  term: (key: string, fallback?: string) => string;
  loading: boolean;
  setSector: (sector: string) => void;
}

const TerminologyContext = createContext<TerminologyContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

// Cache local de terminologia por tenant_slug
const terminologyCache: Record<string, Terminology> = {};

export function TerminologyProvider({ 
  children,
  sector: propSector,
  tenantSlug,
}: { 
  children: ReactNode;
  sector?: string;
  tenantSlug?: string;
}) {
  const [sector, setSector] = useState(propSector || 'real_estate');
  const [terminology, setTerminology] = useState<Terminology>(DEFAULT_TERMINOLOGY);
  const [loading, setLoading] = useState(false);

  // Atualizar sector quando a prop mudar
  useEffect(() => {
    if (propSector && propSector !== sector) {
      setSector(propSector);
    }
  }, [propSector]);

  useEffect(() => {
    const loadTerminology = async () => {
      const cacheKey = tenantSlug || sector;
      
      // Verificar cache primeiro
      if (terminologyCache[cacheKey]) {
        setTerminology(terminologyCache[cacheKey]);
        return;
      }

      setLoading(true);
      try {
        // Se temos tenantSlug, usar endpoint específico do tenant (com custom_terminology)
        // Caso contrário, usar endpoint genérico do sector
        const endpoint = tenantSlug 
          ? `/platform/terminology/tenant/${tenantSlug}`
          : `/platform/terminology/${sector}`;
          
        const response = await fetch(`${API_URL}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          const newTerminology = { ...DEFAULT_TERMINOLOGY, ...data.terminology };
          terminologyCache[cacheKey] = newTerminology;
          setTerminology(newTerminology);
          
          // Se recebemos sector do tenant, atualizar
          if (data.sector) {
            setSector(data.sector);
          }
        }
      } catch (error) {
        console.error('Error loading terminology:', error);
        // Manter terminologia default em caso de erro
      } finally {
        setLoading(false);
      }
    };

    loadTerminology();
  }, [sector, tenantSlug]);

  // Função helper para obter termo
  const term = (key: string, fallback?: string): string => {
    return terminology[key] || fallback || key;
  };

  return (
    <TerminologyContext.Provider value={{ 
      sector, 
      terminology, 
      term, 
      loading,
      setSector 
    }}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminology() {
  const context = useContext(TerminologyContext);
  if (context === undefined) {
    // Retornar valores default se usado fora do provider
    return {
      sector: 'real_estate',
      terminology: DEFAULT_TERMINOLOGY,
      term: (key: string, fallback?: string) => DEFAULT_TERMINOLOGY[key] || fallback || key,
      loading: false,
      setSector: () => {},
    };
  }
  return context;
}

// Hook simplificado para usar apenas o termo
export function useTerm() {
  const { term } = useTerminology();
  return term;
}
