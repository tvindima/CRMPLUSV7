/**
 * Context de terminologia multi-tenant
 * Permite que cada tenant use termos específicos do seu setor
 * (imobiliário, automóvel, barcos, serviços, etc.)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

export type Sector = 'real_estate' | 'automotive' | 'boats' | 'retail' | 'services' | 'hospitality' | 'other';

export interface Terminology {
  // Entidade principal (imóvel, veículo, produto, etc.)
  item: string;
  items: string;
  itemCapital: string;
  itemsCapital: string;
  
  // Agentes/Comerciais
  agent: string;
  agents: string;
  agentCapital: string;
  agentsCapital: string;
  agentRole: string;
  
  // Ações e estados
  searchPlaceholder: string;
  noItemsFound: string;
  newItem: string;
  editItem: string;
  
  // Navegação
  menuItems: string;
  menuLeads: string;
  menuClients: string;
  menuAgenda: string;
  
  // Específicos
  visit: string;
  visits: string;
  proposal: string;
  proposals: string;
}

const TERMINOLOGY: Record<Sector, Terminology> = {
  real_estate: {
    item: 'imóvel',
    items: 'imóveis',
    itemCapital: 'Imóvel',
    itemsCapital: 'Imóveis',
    agent: 'agente',
    agents: 'agentes',
    agentCapital: 'Agente',
    agentsCapital: 'Agentes',
    agentRole: 'Agente Imobiliário',
    searchPlaceholder: 'Pesquisar imóveis...',
    noItemsFound: 'Nenhum imóvel encontrado',
    newItem: 'Novo Imóvel',
    editItem: 'Editar Imóvel',
    menuItems: 'Imóveis',
    menuLeads: 'Leads',
    menuClients: 'Clientes',
    menuAgenda: 'Agenda',
    visit: 'visita',
    visits: 'visitas',
    proposal: 'proposta',
    proposals: 'propostas',
  },
  automotive: {
    item: 'veículo',
    items: 'veículos',
    itemCapital: 'Veículo',
    itemsCapital: 'Veículos',
    agent: 'comercial',
    agents: 'comerciais',
    agentCapital: 'Comercial',
    agentsCapital: 'Comerciais',
    agentRole: 'Comercial',
    searchPlaceholder: 'Pesquisar veículos...',
    noItemsFound: 'Nenhum veículo encontrado',
    newItem: 'Novo Veículo',
    editItem: 'Editar Veículo',
    menuItems: 'Veículos',
    menuLeads: 'Leads',
    menuClients: 'Clientes',
    menuAgenda: 'Agenda',
    visit: 'test drive',
    visits: 'test drives',
    proposal: 'proposta',
    proposals: 'propostas',
  },
  boats: {
    item: 'embarcação',
    items: 'embarcações',
    itemCapital: 'Embarcação',
    itemsCapital: 'Embarcações',
    agent: 'consultor',
    agents: 'consultores',
    agentCapital: 'Consultor',
    agentsCapital: 'Consultores',
    agentRole: 'Consultor Náutico',
    searchPlaceholder: 'Pesquisar embarcações...',
    noItemsFound: 'Nenhuma embarcação encontrada',
    newItem: 'Nova Embarcação',
    editItem: 'Editar Embarcação',
    menuItems: 'Embarcações',
    menuLeads: 'Leads',
    menuClients: 'Clientes',
    menuAgenda: 'Agenda',
    visit: 'visita',
    visits: 'visitas',
    proposal: 'proposta',
    proposals: 'propostas',
  },
  retail: {
    item: 'produto',
    items: 'produtos',
    itemCapital: 'Produto',
    itemsCapital: 'Produtos',
    agent: 'vendedor',
    agents: 'vendedores',
    agentCapital: 'Vendedor',
    agentsCapital: 'Vendedores',
    agentRole: 'Vendedor',
    searchPlaceholder: 'Pesquisar produtos...',
    noItemsFound: 'Nenhum produto encontrado',
    newItem: 'Novo Produto',
    editItem: 'Editar Produto',
    menuItems: 'Produtos',
    menuLeads: 'Leads',
    menuClients: 'Clientes',
    menuAgenda: 'Agenda',
    visit: 'atendimento',
    visits: 'atendimentos',
    proposal: 'orçamento',
    proposals: 'orçamentos',
  },
  services: {
    item: 'serviço',
    items: 'serviços',
    itemCapital: 'Serviço',
    itemsCapital: 'Serviços',
    agent: 'consultor',
    agents: 'consultores',
    agentCapital: 'Consultor',
    agentsCapital: 'Consultores',
    agentRole: 'Consultor',
    searchPlaceholder: 'Pesquisar serviços...',
    noItemsFound: 'Nenhum serviço encontrado',
    newItem: 'Novo Serviço',
    editItem: 'Editar Serviço',
    menuItems: 'Serviços',
    menuLeads: 'Leads',
    menuClients: 'Clientes',
    menuAgenda: 'Agenda',
    visit: 'reunião',
    visits: 'reuniões',
    proposal: 'proposta',
    proposals: 'propostas',
  },
  hospitality: {
    item: 'alojamento',
    items: 'alojamentos',
    itemCapital: 'Alojamento',
    itemsCapital: 'Alojamentos',
    agent: 'gestor',
    agents: 'gestores',
    agentCapital: 'Gestor',
    agentsCapital: 'Gestores',
    agentRole: 'Gestor de Reservas',
    searchPlaceholder: 'Pesquisar alojamentos...',
    noItemsFound: 'Nenhum alojamento encontrado',
    newItem: 'Novo Alojamento',
    editItem: 'Editar Alojamento',
    menuItems: 'Alojamentos',
    menuLeads: 'Reservas',
    menuClients: 'Hóspedes',
    menuAgenda: 'Agenda',
    visit: 'check-in',
    visits: 'check-ins',
    proposal: 'reserva',
    proposals: 'reservas',
  },
  other: {
    item: 'item',
    items: 'itens',
    itemCapital: 'Item',
    itemsCapital: 'Itens',
    agent: 'colaborador',
    agents: 'colaboradores',
    agentCapital: 'Colaborador',
    agentsCapital: 'Colaboradores',
    agentRole: 'Colaborador',
    searchPlaceholder: 'Pesquisar...',
    noItemsFound: 'Nenhum item encontrado',
    newItem: 'Novo Item',
    editItem: 'Editar Item',
    menuItems: 'Itens',
    menuLeads: 'Leads',
    menuClients: 'Clientes',
    menuAgenda: 'Agenda',
    visit: 'evento',
    visits: 'eventos',
    proposal: 'proposta',
    proposals: 'propostas',
  },
};

interface TerminologyContextData {
  sector: Sector;
  terms: Terminology;
  loading: boolean;
  setSector: (sector: Sector) => void;
  refreshFromTenant: () => Promise<void>;
}

const TerminologyContext = createContext<TerminologyContextData>({
  sector: 'real_estate',
  terms: TERMINOLOGY.real_estate,
  loading: false,
  setSector: () => {},
  refreshFromTenant: async () => {},
});

const STORAGE_KEY = '@crm_plus_sector';

export const TerminologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sector, setSectorState] = useState<Sector>('real_estate');
  const [loading, setLoading] = useState(true);

  // Carregar sector guardado ou do tenant
  useEffect(() => {
    loadSector();
  }, []);

  const loadSector = async () => {
    try {
      // Primeiro, tentar carregar do AsyncStorage (cache local)
      const storedSector = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSector && TERMINOLOGY[storedSector as Sector]) {
        setSectorState(storedSector as Sector);
      }
      
      // Depois, tentar carregar do tenant (se disponível)
      await refreshFromTenant();
    } catch (error) {
      console.warn('[Terminology] Erro ao carregar sector:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshFromTenant = useCallback(async () => {
    try {
      // Tentar obter sector do tenant atual
      const response = await apiService.get('/tenant/config');
      if (response?.sector && TERMINOLOGY[response.sector as Sector]) {
        setSectorState(response.sector as Sector);
        await AsyncStorage.setItem(STORAGE_KEY, response.sector);
        console.log('[Terminology] Sector carregado do tenant:', response.sector);
      }
    } catch (error) {
      // Endpoint pode não existir ainda - usar default
      console.log('[Terminology] Usando sector default (real_estate)');
    }
  }, []);

  const setSector = useCallback(async (newSector: Sector) => {
    setSectorState(newSector);
    await AsyncStorage.setItem(STORAGE_KEY, newSector);
  }, []);

  const terms = TERMINOLOGY[sector] || TERMINOLOGY.real_estate;

  return (
    <TerminologyContext.Provider value={{ 
      sector, 
      terms, 
      loading, 
      setSector, 
      refreshFromTenant 
    }}>
      {children}
    </TerminologyContext.Provider>
  );
};

export const useTerminology = () => {
  const context = useContext(TerminologyContext);
  if (!context) {
    throw new Error('useTerminology must be used within a TerminologyProvider');
  }
  return context;
};

export default TerminologyContext;
