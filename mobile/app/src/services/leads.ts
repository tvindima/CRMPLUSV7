/**
 * Serviço de API para Leads
 * Mobile App B2E - endpoints otimizados para agentes
 * Usa apiService centralizado para autenticação e multi-tenant
 */

import { apiService } from './api';
import type { Lead, LeadStatus } from '../types';

export interface LeadFilters {
  status?: LeadStatus;
  search?: string;
  property_id?: number;
  skip?: number;
  limit?: number;
}

export interface LeadCreateInput {
  name: string;
  email?: string;
  phone: string;
  source?: string;
  property_id?: number;
  notes?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  property_types?: string[];
}

export interface LeadUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  source?: string;
  notes?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_locations?: string[];
  property_types?: string[];
  property_id?: number;
}

export interface LeadListItem {
  id: number;
  name: string;
  email?: string;
  phone: string;
  status: LeadStatus;
  source?: string;
  property_id?: number;
  property_title?: string;
  created_at: string;
  updated_at?: string;
}

const leadsService = {
  /**
   * Lista leads do agente atual (filtro automático por agent_id via token)
   */
  async list(filters?: LeadFilters): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.property_id) params.append('property_id', filters.property_id.toString());
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/mobile/leads${queryString ? '?' + queryString : ''}`;
    
    return apiService.get<Lead[]>(endpoint);
  },

  /**
   * Obtém detalhes de um lead específico
   */
  async getById(id: number): Promise<Lead> {
    return apiService.get<Lead>(`/mobile/leads/${id}`);
  },

  /**
   * Cria um novo lead
   */
  async create(data: LeadCreateInput): Promise<Lead> {
    return apiService.post<Lead>('/mobile/leads', data);
  },

  /**
   * Atualiza um lead
   */
  async update(id: number, data: LeadUpdateInput): Promise<Lead> {
    return apiService.put<Lead>(`/mobile/leads/${id}`, data);
  },

  /**
   * Atualiza apenas o status do lead
   */
  async updateStatus(id: number, status: LeadStatus): Promise<Lead> {
    return apiService.patch<Lead>(`/mobile/leads/${id}/status`, { status });
  },

  /**
   * Elimina um lead (soft delete)
   */
  async delete(id: number): Promise<void> {
    return apiService.delete(`/mobile/leads/${id}`);
  },

  /**
   * Obtém estatísticas de leads
   */
  async getStats(): Promise<{
    total: number;
    by_status: Record<LeadStatus, number>;
    recent: number;
    conversion_rate: number;
  }> {
    return apiService.get('/mobile/leads/stats');
  },

  /**
   * Associa lead a um imóvel
   */
  async assignProperty(leadId: number, propertyId: number): Promise<Lead> {
    return apiService.post<Lead>(`/mobile/leads/${leadId}/assign-property`, {
      property_id: propertyId,
    });
  },

  /**
   * Remove associação de imóvel
   */
  async unassignProperty(leadId: number): Promise<Lead> {
    return apiService.delete<Lead>(`/mobile/leads/${leadId}/unassign-property`);
  },
};

export { leadsService };
export default leadsService;
