/**
 * Serviço de API para Visitas
 * Mobile App B2E - endpoints otimizados para agentes
 */

import { apiService } from './api';
import type { Visit, VisitStatus } from '../types';

export interface VisitFilters {
  status?: VisitStatus;
  date?: string;
  property_id?: number;
  lead_id?: number;
}

export interface VisitCreateInput {
  property_id: number;
  lead_id?: number;
  scheduled_date: string;
  duration_minutes?: number;
  notes?: string;
}

export interface CheckInData {
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface CheckOutData {
  notes?: string;
  client_feedback?: string;
  next_steps?: string;
}

export interface UpcomingVisit {
  id: number;
  property_title: string;
  scheduled_at: string;
  lead_name: string | null;
  property_reference: string | null;
  status: string;
}

const visitsService = {
  /**
   * Lista minhas visitas (filtro automático por agent_id)
   */
  async list(filters?: VisitFilters): Promise<Visit[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.property_id) params.append('property_id', filters.property_id.toString());
    if (filters?.lead_id) params.append('lead_id', filters.lead_id.toString());

    const queryString = params.toString();
    const endpoint = `/mobile/visits${queryString ? '?' + queryString : ''}`;
    
    return apiService.get<Visit[]>(endpoint);
  },

  /**
   * Obtém próximas visitas para widget HomeScreen
   * Backend implementa GET /mobile/visits/upcoming
   */
  async getUpcoming(limit: number = 5): Promise<UpcomingVisit[]> {
    return apiService.get<UpcomingVisit[]>(`/mobile/visits/upcoming?limit=${limit}`);
  },

  /**
   * Obtém detalhes de uma visita específica
   */
  async get(id: number): Promise<Visit> {
    return apiService.get<Visit>(`/mobile/visits/${id}`);
  },

  /**
   * Cria uma nova visita
   */
  async create(data: VisitCreateInput): Promise<Visit> {
    return apiService.post<Visit>('/mobile/visits', data);
  },

  /**
   * Atualiza uma visita existente
   */
  async update(id: number, data: Partial<VisitCreateInput>): Promise<Visit> {
    return apiService.put<Visit>(`/mobile/visits/${id}`, data);
  },

  /**
   * Remove uma visita
   */
  async delete(id: number): Promise<void> {
    await apiService.delete<void>(`/mobile/visits/${id}`);
  },

  /**
   * Check-in em uma visita (com coordenadas GPS)
   */
  async checkIn(id: number, data: CheckInData): Promise<Visit> {
    return apiService.post<Visit>(`/mobile/visits/${id}/check-in`, data);
  },

  /**
   * Check-out de uma visita
   */
  async checkOut(id: number, data: CheckOutData): Promise<Visit> {
    return apiService.post<Visit>(`/mobile/visits/${id}/check-out`, data);
  },

  /**
   * Cancela uma visita
   */
  async cancel(id: number, reason?: string): Promise<Visit> {
    return apiService.post<Visit>(`/mobile/visits/${id}/cancel`, { reason });
  },

  /**
   * Reagenda uma visita
   */
  async reschedule(id: number, newDate: string): Promise<Visit> {
    return apiService.post<Visit>(`/mobile/visits/${id}/reschedule`, {
      scheduled_at: newDate,
    });
  },

  /**
   * Obtém visitas do dia atual
   */
  async getToday(): Promise<Visit[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.list({ date: today });
  },

  /**
   * Obtém estatísticas de visitas do agente atual
   */
  async getStats(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    today: number;
    week: number;
  }> {
    return apiService.get(`/mobile/visits/stats`);
  },
};

export { visitsService };
