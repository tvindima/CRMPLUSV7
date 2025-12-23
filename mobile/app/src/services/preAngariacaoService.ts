import { apiService } from './api';

export interface PreAngariacaoListItem {
  id: number;
  referencia_interna?: string | null;
  proprietario_nome: string;
  status: string;
  created_at: string;
  progresso: number;
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
};
