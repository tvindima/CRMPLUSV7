/**
 * Serviço de API para Propriedades
 */

import { apiService } from './api';
import { Property, PropertyStatus, PropertyType } from '../types';

export interface PropertyFilters {
  status?: PropertyStatus;
  type?: PropertyType;
  search?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  agent_id?: number;
}

export interface PropertyCreateInput {
  title: string;
  description: string;
  price: number;
  type: PropertyType;
  status: PropertyStatus;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  address: string;
  city: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  features?: string[];
  photos?: string[];
}

const propertiesService = {
  /**
   * Lista todas as propriedades com filtros opcionais
   */
  async list(filters?: PropertyFilters): Promise<Property[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.agent_id) params.append('agent_id', filters.agent_id.toString());
    const queryString = params.toString();
    return apiService.get<Property[]>(`/properties${queryString ? '?' + queryString : ''}`);
  },

  /**
   * Obtém detalhes de uma propriedade específica
   */
  async get(id: number): Promise<Property> {
    return apiService.get<Property>(`/properties/${id}`);
  },

  /**
   * Cria uma nova propriedade
   */
  async create(data: PropertyCreateInput): Promise<Property> {
    return apiService.post<Property>('/properties', data);
  },

  /**
   * Atualiza uma propriedade existente
   */
  async update(id: number, data: Partial<PropertyCreateInput>): Promise<Property> {
    return apiService.put<Property>(`/properties/${id}`, data);
  },

  /**
   * Remove uma propriedade
   */
  async delete(id: number): Promise<void> {
    await apiService.delete<void>(`/properties/${id}`);
  },

  /**
   * Upload de fotos da propriedade
   * TODO: Implementar upload via FormData - requer ajuste no apiService
   */
  async uploadPhotos(propertyId: number, photos: File[]): Promise<string[]> {
    // Por agora, retorna array vazio - upload feito via Cloudinary directamente
    console.warn('[Properties] uploadPhotos not implemented yet');
    return [];
  },

  /**
   * Obtém propriedades de um agente específico
   */
  async getByAgent(agentId: number): Promise<Property[]> {
    return apiService.get<Property[]>(`/agents/${agentId}/properties`);
  },

  /**
   * Obtém estatísticas de propriedades do agente atual
   */
  async getStats(): Promise<{
    total: number;
    available: number;
    sold: number;
    rented: number;
    total_value: number;
  }> {
    return apiService.get<{
      total: number;
      available: number;
      sold: number;
      rented: number;
      total_value: number;
    }>('/properties/stats');
  },
};

export default propertiesService;
