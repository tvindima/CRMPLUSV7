/**
 * Serviço de API para Leads
 * Mobile App B2E - endpoints otimizados para agentes
 */

import { apiService } from './api';
import type { Lead, LeadStatus, LeadSource } from '../types';

export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  my_leads?: boolean;
}

export interface LeadCreateInput {
  name: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  notes?: string;
}

const leadsService = {
  /**
   * Lista meus leads (filtro automático por agent_id no backend)
   */
  async list(filters?: LeadFilters): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.search) params.append('search', filters.search);
    params.append('my_leads', 'true'); // Sempre filtrar por agent_id

    const queryString = params.toString();
    const endpoint = `/mobile/leads${queryString ? '?' + queryString : ''}`;
    
    return apiService.get<Lead[]>(endpoint);
  },

  /**
   * Obtém detalhes de um lead específico
   */
  async get(id: number): Promise<Lead> {
    return apiService.get<Lead>(`/mobile/leads/${id}`);
  },

  /**
   * Cria um novo lead em campo (auto-atribuição ao agente)
   * Backend implementa POST /mobile/leads
   */
  async create(data: LeadCreateInput): Promise<Lead> {
    return apiService.post<Lead>('/mobile/leads', data);
  },

  /**
   * Atualiza um lead existente
   */
  async update(id: number, data: Partial<LeadCreateInput>): Promise<Lead> {
    return apiService.put<Lead>(`/leads/${id}`, data);
  },

  /**
   * Atualiza apenas o status de um lead
   */
  async updateStatus(id: number, status: LeadStatus): Promise<Lead> {
    return apiService.patch<Lead>(`/leads/${id}/status`, { status });
  },

  /**
   * Remove um lead
   */
  async delete(id: number): Promise<void> {
    await apiService.delete<void>(`/leads/${id}`);
  },

  /**
   * Obtém leads de um agente específico
   */
  async getByAgent(agentId: number): Promise<Lead[]> {
    return apiService.get<Lead[]>(`/agents/${agentId}/leads`);
  },

  /**
   * Obtém estatísticas de leads do agente atual
   */
  async getStats(): Promise<{
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  }> {
    return apiService.get<{
      total: number;
      new: number;
      contacted: number;
      qualified: number;
      converted: number;
      lost: number;
    }>('/leads/stats');
  },

  /**
   * Adiciona uma nota ao histórico do lead
   */
  async addNote(id: number, note: string): Promise<Lead> {
    return apiService.post<Lead>(`/leads/${id}/notes`, { note });
  },

  /**
   * Registra uma interação com o lead
   */
  async logInteraction(
    id: number,
    data: {
      type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'other';
      notes?: string;
    }
  ): Promise<void> {
    await apiService.post<void>(`/leads/${id}/interactions`, data);
  },
};

export default leadsService;
