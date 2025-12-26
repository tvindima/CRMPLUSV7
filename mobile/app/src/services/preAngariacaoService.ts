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

export interface UpdatePreAngariacaoPayload {
  proprietario_nome?: string;
  proprietario_nif?: string;
  proprietario_telefone?: string;
  proprietario_email?: string;
  morada?: string;
  codigo_postal?: string;
  freguesia?: string;
  concelho?: string;
  distrito?: string;
  tipologia?: string;
  area_bruta?: number;
  area_util?: number;
  estado_conservacao?: string;
  valor_pretendido?: number;
  notas?: string;
  fotos?: Array<{
    url: string;
    caption?: string | null;
    room_type?: string | null;
    order?: number;
    uploaded_at?: string;
  }>;
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
  update: async (preAngariacaoId: number, payload: UpdatePreAngariacaoPayload) => {
    return apiService.put(`/pre-angariacoes/${preAngariacaoId}`, payload);
  },
  delete: async (preAngariacaoId: number) => {
    return apiService.delete(`/pre-angariacoes/${preAngariacaoId}`);
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
  removeDocumento: async (preAngariacaoId: number, docIndex: number) => {
    return apiService.delete(`/pre-angariacoes/${preAngariacaoId}/documentos/${docIndex}`);
  },
};