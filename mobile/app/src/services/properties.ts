/**
 * Serviço de API para Propriedades
 */

import api from './api';
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
    const response = await api.get('/properties', { params: filters });
    return response.data;
  },

  /**
   * Obtém detalhes de uma propriedade específica
   */
  async get(id: number): Promise<Property> {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova propriedade
   */
  async create(data: PropertyCreateInput): Promise<Property> {
    const response = await api.post('/properties', data);
    return response.data;
  },

  /**
   * Atualiza uma propriedade existente
   */
  async update(id: number, data: Partial<PropertyCreateInput>): Promise<Property> {
    const response = await api.put(`/properties/${id}`, data);
    return response.data;
  },

  /**
   * Remove uma propriedade
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/properties/${id}`);
  },

  /**
   * Upload de fotos da propriedade
   */
  async uploadPhotos(propertyId: number, photos: File[]): Promise<string[]> {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photos`, photo);
    });

    const response = await api.post(`/properties/${propertyId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.urls;
  },

  /**
   * Obtém propriedades de um agente específico
   */
  async getByAgent(agentId: number): Promise<Property[]> {
    const response = await api.get(`/agents/${agentId}/properties`);
    return response.data;
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
    const response = await api.get('/properties/stats');
    return response.data;
  },
};

export default propertiesService;
