/**
 * Service para CMI - Contrato de Mediação Imobiliária
 */
import { apiService } from './api';

export interface CMI {
  id: number;
  numero_contrato: string;
  status: string;
  
  // Cliente
  cliente_nome: string;
  cliente_nif?: string;
  cliente_cc?: string;
  cliente_cc_validade?: string;
  cliente_morada?: string;
  cliente_codigo_postal?: string;
  cliente_localidade?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_estado_civil?: string;
  
  // Segundo cliente
  cliente2_nome?: string;
  cliente2_nif?: string;
  cliente2_cc?: string;
  
  // Imóvel
  imovel_tipo?: string;
  imovel_tipologia?: string;
  imovel_morada?: string;
  imovel_codigo_postal?: string;
  imovel_localidade?: string;
  imovel_freguesia?: string;
  imovel_concelho?: string;
  imovel_distrito?: string;
  imovel_artigo_matricial?: string;
  imovel_fraccao?: string;
  imovel_area_bruta?: number;
  imovel_area_util?: number;
  imovel_estado_conservacao?: string;
  imovel_certificado_energetico?: string;
  
  // Condições
  tipo_contrato: string;
  tipo_negocio: string;
  valor_pretendido?: number;
  valor_minimo?: number;
  comissao_percentagem?: number;
  comissao_valor_fixo?: number;
  comissao_iva_incluido: boolean;
  prazo_meses: number;
  renovacao_automatica: boolean;
  data_inicio?: string;
  data_fim?: string;
  
  // Mediador
  mediador_nome: string;
  mediador_licenca_ami: string;
  mediador_nif: string;
  agente_nome?: string;
  
  // Documentos
  documentos_entregues: Array<{
    tipo: string;
    nome: string;
    entregue: boolean;
    obrigatorio: boolean;
  }>;
  
  // Assinaturas
  assinatura_cliente?: string;
  assinatura_cliente_data?: string;
  assinatura_mediador?: string;
  assinatura_mediador_data?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CMIListItem {
  id: number;
  numero_contrato: string;
  cliente_nome: string;
  imovel_morada?: string;
  imovel_tipologia?: string;
  valor_pretendido?: number;
  tipo_contrato: string;
  status: string;
  created_at: string;
}

export interface CreateCMIFromFirstImpression {
  first_impression_id: number;
}

export interface UpdateCMI {
  cliente_nome?: string;
  cliente_nif?: string;
  cliente_cc?: string;
  cliente_cc_validade?: string;
  cliente_morada?: string;
  cliente_codigo_postal?: string;
  cliente_localidade?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_estado_civil?: string;
  
  imovel_tipo?: string;
  imovel_tipologia?: string;
  imovel_morada?: string;
  imovel_codigo_postal?: string;
  imovel_localidade?: string;
  imovel_freguesia?: string;
  imovel_concelho?: string;
  imovel_artigo_matricial?: string;
  imovel_area_bruta?: number;
  imovel_area_util?: number;
  imovel_estado_conservacao?: string;
  imovel_certificado_energetico?: string;
  
  tipo_contrato?: string;
  tipo_negocio?: string;
  valor_pretendido?: number;
  valor_minimo?: number;
  comissao_percentagem?: number;
  prazo_meses?: number;
  
  // Agente responsável
  agente_nome?: string;
}

export interface OCRResult {
  sucesso: boolean;
  tipo: string;
  dados_extraidos: Record<string, any>;
  confianca: number;
  mensagem?: string;
}

class CMIService {
  /**
   * Listar CMIs do agente
   */
  async list(status?: string): Promise<CMIListItem[]> {
    const params = status ? `?status=${status}` : '';
    return apiService.get<CMIListItem[]>(`/cmi/${params}`);
  }
  
  /**
   * Obter CMI por ID
   */
  async getById(id: number): Promise<CMI> {
    return apiService.get<CMI>(`/cmi/${id}`);
  }
  
  /**
   * Criar CMI a partir de 1ª Impressão
   */
  async createFromFirstImpression(firstImpressionId: number): Promise<CMI> {
    return apiService.post<CMI>('/cmi/from-first-impression', {
      first_impression_id: firstImpressionId
    });
  }

  async getByFirstImpression(firstImpressionId: number): Promise<CMI> {
    return apiService.get<CMI>(`/cmi/by-first-impression/${firstImpressionId}`);
  }
  
  /**
   * Atualizar CMI
   */
  async update(id: number, data: UpdateCMI): Promise<CMI> {
    return apiService.put<CMI>(`/cmi/${id}`, data);
  }
  
  /**
   * Cancelar CMI
   */
  async cancel(id: number): Promise<void> {
    return apiService.delete(`/cmi/${id}`);
  }
  
  /**
   * Adicionar assinatura do cliente
   */
  async addClientSignature(id: number, signature: string, local?: string): Promise<CMI> {
    return apiService.post<CMI>(`/cmi/${id}/assinatura-cliente`, {
      assinatura: signature,
      local: local
    });
  }
  
  /**
   * Adicionar assinatura do mediador
   */
  async addAgentSignature(id: number, signature: string): Promise<CMI> {
    return apiService.post<CMI>(`/cmi/${id}/assinatura-mediador`, {
      assinatura: signature
    });
  }
  
  /**
   * Processar documento via OCR
   */
  async processOCR(id: number, tipo: string, imagemBase64: string): Promise<OCRResult> {
    return apiService.post<OCRResult>(`/cmi/${id}/ocr`, {
      tipo: tipo,
      imagem_base64: imagemBase64
    });
  }
  
  /**
   * Marcar documento como entregue
   */
  async markDocument(id: number, docTipo: string, entregue: boolean = true): Promise<CMI> {
    return apiService.put<CMI>(`/cmi/${id}/documentos/${docTipo}?entregue=${entregue}`);
  }
  
  /**
   * Obter estatísticas
   */
  async getStats(): Promise<{
    total: number;
    rascunhos: number;
    pendentes: number;
    assinados: number;
    cancelados: number;
  }> {
    return apiService.get('/cmi/stats');
  }

  /**
   * Download do PDF do CMI
   */
  async getPdf(id: number): Promise<Blob> {
    return apiService.download(`/cmi/${id}/pdf`, {
      method: 'GET',
    });
  }
}

export const cmiService = new CMIService();
