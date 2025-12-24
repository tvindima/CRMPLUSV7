import { apiService } from './api';

export interface PreAngariacaoListItem {
  id: number;
  referencia_interna?: string | null;
  proprietario_nome: string;
  status: string;
  created_at: string;
  progresso: number;
}

export interface AddDocumentoPayload {
  type: string;
  name: string;
  url: string;
  notes?: string;
}

export const preAngariacaoService = {
  createFromFirstImpression: async (firstImpressionId: number) => {
    return apiService.post('/pre-angariacoes/from-first-impression', {
      first_impression_id: firstImpressionId,
    });
  },
  list: async (): Promise<PreAngariacaoListItem[]> => {
    return apiService.get('/pre-angariacoes');
  },
  getById: async (id: number) => {
    return apiService.get(`/pre-angariacoes/${id}`);
  },
  getByFirstImpression: async (firstImpressionId: number) => {
    return apiService.get(`/pre-angariacoes/by-first-impression/${firstImpressionId}`);
  },
  addDocumento: async (preAngariacaoId: number, payload: AddDocumentoPayload | AddDocumentoPayload[]) => {
    // Suporta 1 ou vários; se array, envia sequencial para respeitar checklist
    if (Array.isArray(payload)) {
      let last;
      for (const p of payload) {
        last = await apiService.post(`/pre-angariacoes/${preAngariacaoId}/documentos`, p);
      }
      return last;
    }
    return apiService.post(`/pre-angariacoes/${preAngariacaoId}/documentos`, payload);
  },
};
