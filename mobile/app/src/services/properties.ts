/**
 * Serviço de API para Imóveis/Properties
 * Mobile App B2E - endpoints otimizados para agentes
 * Usa apiService centralizado para autenticação e multi-tenant
 */

import { apiService } from './api';
import type { Property, PropertyStatus, PropertyType } from '../types';

export interface PropertyFilters {
  status?: PropertyStatus;
  property_type?: PropertyType;
  search?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  location?: string;
  skip?: number;
  limit?: number;
}

export interface PropertyCreateInput {
  title: string;
  description?: string;
  property_type: PropertyType;
  status?: PropertyStatus;
  price?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  features?: string[];
  photos?: string[];
}

export interface PropertyUpdateInput extends Partial<PropertyCreateInput> {}

export interface PropertyListItem {
  id: number;
  reference?: string;
  title: string;
  property_type: PropertyType;
  status: PropertyStatus;
  price?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  district?: string;
  main_photo?: string;
  photos_count: number;
  created_at: string;
  updated_at?: string;
}

export interface PropertyStats {
  total: number;
  by_status: Record<PropertyStatus, number>;
  by_type: Record<PropertyType, number>;
  avg_price: number;
  recent: number;
}

const propertiesService = {
  /**
   * Lista imóveis do agente atual (filtro automático por agent_id via token)
   */
  async list(filters?: PropertyFilters): Promise<Property[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.property_type) params.append('property_type', filters.property_type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.min_price) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price) params.append('max_price', filters.max_price.toString());
    if (filters?.min_area) params.append('min_area', filters.min_area.toString());
    if (filters?.max_area) params.append('max_area', filters.max_area.toString());
    if (filters?.bedrooms) params.append('bedrooms', filters.bedrooms.toString());
    if (filters?.location) params.append('location', filters.location);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/mobile/properties${queryString ? '?' + queryString : ''}`;
    
    return apiService.get<Property[]>(endpoint);
  },

  /**
   * Obtém detalhes de um imóvel específico
   */
  async getById(id: number): Promise<Property> {
    return apiService.get<Property>(`/mobile/properties/${id}`);
  },

  /**
   * Cria um novo imóvel
   */
  async create(data: PropertyCreateInput): Promise<Property> {
    return apiService.post<Property>('/mobile/properties', data);
  },

  /**
   * Atualiza um imóvel
   */
  async update(id: number, data: PropertyUpdateInput): Promise<Property> {
    return apiService.put<Property>(`/mobile/properties/${id}`, data);
  },

  /**
   * Atualiza apenas o status do imóvel
   */
  async updateStatus(id: number, status: PropertyStatus): Promise<Property> {
    return apiService.patch<Property>(`/mobile/properties/${id}/status`, { status });
  },

  /**
   * Elimina um imóvel (soft delete)
   */
  async delete(id: number): Promise<void> {
    return apiService.delete(`/mobile/properties/${id}`);
  },

  /**
   * Obtém estatísticas de imóveis
   */
  async getStats(): Promise<PropertyStats> {
    return apiService.get('/mobile/properties/stats');
  },

  /**
   * Upload de fotos de um imóvel
   */
  async uploadPhotos(id: number, formData: FormData): Promise<{ photos: string[] }> {
    return apiService.uploadFile(`/mobile/properties/${id}/photos`, formData);
  },

  /**
   * Remove uma foto de um imóvel
   */
  async deletePhoto(propertyId: number, photoIndex: number): Promise<void> {
    return apiService.delete(`/mobile/properties/${propertyId}/photos/${photoIndex}`);
  },

  /**
   * Reordena fotos de um imóvel
   */
  async reorderPhotos(propertyId: number, photoOrder: number[]): Promise<{ photos: string[] }> {
    return apiService.patch(`/mobile/properties/${propertyId}/photos/reorder`, {
      order: photoOrder,
    });
  },

  /**
   * Obtém leads interessados num imóvel
   */
  async getInterestedLeads(propertyId: number): Promise<any[]> {
    return apiService.get(`/mobile/properties/${propertyId}/leads`);
  },

  /**
   * Obtém visitas agendadas para um imóvel
   */
  async getScheduledVisits(propertyId: number): Promise<any[]> {
    return apiService.get(`/mobile/properties/${propertyId}/visits`);
  },
};

export { propertiesService };
export default propertiesService;
