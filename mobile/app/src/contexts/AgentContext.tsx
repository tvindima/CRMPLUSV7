/**
 * AgentContext - Cache compartilhado de dados do agente
 * Evita chamadas duplicadas a /mobile/dashboard/stats e /agents/{id}
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

interface AgentProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  avatar_url?: string;
}

interface DashboardStats {
  agent_id: number;
  events_today?: number;
  events_future?: number;
  visits_today?: number;
  tasks_today?: number;
  new_leads?: number;
  leads?: number;
  properties?: number;
  pre_angariacoes?: number;
}

interface AgentContextData {
  agentProfile: AgentProfile | null;
  stats: DashboardStats | null;
  loading: boolean;
  loadAgentData: () => Promise<void>;
  refreshAgentData: () => Promise<void>;
  clearAgentData: () => void;
}

const AgentContext = createContext<AgentContextData>({} as AgentContextData);

export function AgentProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // ✅ LIMPAR DADOS QUANDO USER MUDA (login/logout)
  useEffect(() => {
    console.log('[AgentContext] User changed, clearing cache');
    setAgentProfile(null);
    setStats(null);
    setLastFetch(0);
  }, [user?.id, accessToken]);

  const clearAgentData = useCallback(() => {
    console.log('[AgentContext] Clearing all agent data');
    setAgentProfile(null);
    setStats(null);
    setLastFetch(0);
  }, []);

  const loadAgentData = useCallback(async () => {
    // Cache por 30 segundos
    const now = Date.now();
    if (agentProfile && stats && (now - lastFetch) < 30000) {
      console.log('[AgentContext] Using cached data');
      return;
    }

    try {
      setLoading(true);
      console.log('[AgentContext] Fetching fresh data...');

      // Uma única chamada para stats
      const statsResponse = await apiService.get<DashboardStats>('/mobile/dashboard/stats');
      console.log('[AgentContext] Stats received:', statsResponse);
      setStats(statsResponse);

      // Se tem agent_id, busca perfil
      if (statsResponse?.agent_id) {
        try {
          const agentResponse = await apiService.get<AgentProfile>(`/agents/${statsResponse.agent_id}`);
          setAgentProfile(agentResponse);
        } catch (error) {
          console.error('[AgentContext] Error loading agent profile:', error);
        }
      }

      setLastFetch(Date.now());
    } catch (error) {
      console.error('[AgentContext] Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  }, [agentProfile, stats, lastFetch]);

  const refreshAgentData = useCallback(async () => {
    setLastFetch(0); // Force refresh
    setStats(null);  // Clear stats to force reload
    setAgentProfile(null);
    await loadAgentData();
  }, [loadAgentData]);

  return (
    <AgentContext.Provider value={{ agentProfile, stats, loading, loadAgentData, refreshAgentData, clearAgentData }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}
