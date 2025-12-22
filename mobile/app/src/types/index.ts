/**
 * Tipos globais da aplicação CRM PLUS Mobile
 */

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'agent' | 'manager';
  avatar_url?: string;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface Property {
  id: number;
  title: string;
  description?: string;
  price: number | null;
  area: number | null;
  location: string | null;
  status: 'available' | 'sold' | 'rented' | 'pending' | null;
  type?: 'house' | 'apartment' | 'land' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  garage_spaces?: number;
  photos?: string[];
  video_url?: string;
  agent_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  property_id?: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  created_at: string;
  updated_at?: string;
}

export interface Visit {
  id: number;
  property_id: number;
  lead_id?: number;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  agent_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface ApiError {
  detail: string;
  status?: number;
  fields?: string[]; // ✨ FASE 2: campos com erro de validação (422)
  retry?: boolean; // ✨ FASE 2: indica se deve tentar novamente (503)
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
