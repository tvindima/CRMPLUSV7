/**
 * Service para First Impressions API
 */
import { apiService } from './api';

export interface FirstImpressionData {
  // IDs
  id?: number;
  agent_id?: number;
  property_id?: number | null;
  lead_id?: number | null;
  
  // Dados CMI
  artigo_matricial?: string | null;
  freguesia?: string | null;
  concelho?: string | null;
  distrito?: string | null;
  area_bruta?: number | null;
  area_util?: number | null;
  tipologia?: string | null;
  ano_construcao?: number | null;
  valor_patrimonial?: number | null;
  estado_conservacao?: string | null;
  valor_estimado?: number | null;
  
  // Dados Cliente
  client_name: string;
  client_nif?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  referred_by?: string | null;
  
  // Localização
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  
  // Fotos
  photos?: string[] | null;
  attachments?: { name: string; url: string; type?: string }[] | null;
  
  // Observações
  observations?: string | null;
  
  // Assinatura
  signature_image?: string | null;
  signature_date?: string | null;
  
  // PDF
  pdf_url?: string | null;
  pdf_generated_at?: string | null;
  
  // Metadata
  status?: 'draft' | 'signed' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export interface FirstImpressionListItem {
  id: number;
  agent_id: number;
  property_id?: number | null;
  lead_id?: number | null;
  client_name: string;
  client_nif?: string | null;
  client_phone: string;
  artigo_matricial?: string | null;
  tipologia?: string | null;
  status: string;
  created_at: string;
  pdf_url?: string | null;
}

export interface FirstImpressionFilters {
  status?: string;
  property_id?: number;
  lead_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export const firstImpressionService = {
  /**
   * Criar nova First Impression (rascunho)
   */
  create: async (data: Omit<FirstImpressionData, 'id' | 'agent_id' | 'status' | 'created_at' | 'updated_at'>): Promise<FirstImpressionData> => {
    try {
      const response = await apiService.post<FirstImpressionData>('/mobile/first-impressions', data);
      console.log('[FirstImpression] ✅ Criado:', response.id);
      return response;
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao criar:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Listar First Impressions (com filtros)
   */
  list: async (filters?: FirstImpressionFilters): Promise<FirstImpressionListItem[]> => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status_filter', filters.status);
      if (filters?.property_id) params.append('property_id', filters.property_id.toString());
      if (filters?.lead_id) params.append('lead_id', filters.lead_id.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.skip) params.append('skip', filters.skip.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const queryString = params.toString();
      const url = queryString ? `/mobile/first-impressions?${queryString}` : '/mobile/first-impressions';
      
      const response = await apiService.get<FirstImpressionListItem[]>(url);
      console.log(`[FirstImpression] ✅ Listados: ${response.length} documentos`);
      return response;
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao listar:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obter detalhes de uma First Impression
   */
  getById: async (id: number): Promise<FirstImpressionData> => {
    try {
      const response = await apiService.get<FirstImpressionData>(`/mobile/first-impressions/${id}`);
      console.log('[FirstImpression] ✅ Detalhes obtidos:', id);
      return response;
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao obter:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Atualizar First Impression
   */
  update: async (id: number, data: Partial<FirstImpressionData>): Promise<FirstImpressionData> => {
    try {
      const response = await apiService.put<FirstImpressionData>(`/mobile/first-impressions/${id}`, data);
      console.log('[FirstImpression] ✅ Atualizado:', id);
      return response;
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao atualizar:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Adicionar assinatura
   */
  addSignature: async (id: number, signatureBase64: string): Promise<FirstImpressionData> => {
    try {
      const response = await apiService.post<FirstImpressionData>(`/mobile/first-impressions/${id}/signature`, {
        signature_image: signatureBase64,
      });
      console.log('[FirstImpression] ✅ Assinatura adicionada:', id);
      return response;
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao adicionar assinatura:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Cancelar First Impression (soft delete)
   */
  cancel: async (id: number): Promise<{ message: string; id: number }> => {
    try {
      const response = await apiService.post<{ message: string; id: number }>(`/mobile/first-impressions/${id}/cancel`, {});
      console.log('[FirstImpression] ✅ Cancelado:', id);
      return response;
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao cancelar:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Apagar First Impression (hard delete)
   */
  delete: async (id: number): Promise<void> => {
    try {
      await apiService.delete(`/mobile/first-impressions/${id}`);
      console.log('[FirstImpression] ✅ Apagado:', id);
    } catch (error: any) {
      console.error('[FirstImpression] ❌ Erro ao apagar:', error.response?.data || error.message);
      throw error;
    }
  },
};
