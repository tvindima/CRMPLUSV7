/**
 * Serviço de autenticação JWT
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, getTenantSlug } from './api';
import { STORAGE_KEYS } from '../constants/config';
import type { User, AuthTokens } from '../types';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    console.log('[AUTH] Iniciando login com:', credentials.username);
    console.log('[AUTH] API Base URL:', apiService['baseURL']);
    
    // CRITICAL: Obter tenant slug para multi-tenant
    const tenantSlug = getTenantSlug();
    console.log('[AUTH] Tenant Slug:', tenantSlug);
    
    try {
      // Mobile App usa /auth/login (mesmo endpoint do backoffice) com JSON
      // CRITICAL: Incluir X-Tenant-Slug para isolamento multi-tenant
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tenantSlug) {
        headers['X-Tenant-Slug'] = tenantSlug;
      }
      
      const response = await fetch(`${apiService['baseURL']}/auth/mobile/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: credentials.username, // Converter username → email
          password: credentials.password,
        }),
      });

      console.log('[AUTH] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AUTH] ❌ Login falhou:', response.status, errorData);
        
        // Extrair mensagem de erro legível
        let errorMessage = `Erro ${response.status}: Login falhou`;
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData.detail.error) {
            // Backend SQLAlchemy error
            errorMessage = `Backend Error: ${errorData.detail.error}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Salvar tokens
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token || data.access_token);
      if (data.expires_at) await AsyncStorage.setItem('expires_at', data.expires_at);

      // Configurar token no apiService
      apiService.setAccessToken(data.access_token);

      // Buscar dados do usuário
      const user = await apiService.get<User>('/auth/me');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      console.log('[AUTH] ✅ Login real bem-sucedido!', user);
      return user;
    } catch (error: any) {
      console.error('[AUTH] ❌ Erro no login:', error);
      throw error; // NÃO usar mock - mostrar erro real
    }
  }

  async logout(): Promise<void> {
    // Revogar refresh token no backend
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await apiService.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      // Continuar mesmo se falhar
      console.error('Erro ao revogar token:', error);
    }

    // Limpar storage local
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      'expires_at',
    ]);
    apiService.setAccessToken(null);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return null;

      apiService.setAccessToken(token);
      
      // IMPORTANTE: /auth/me retorna { user: {...}, agent: {...} }
      const response = await apiService.get<{ user: any; agent: any }>('/auth/me');
      
      // Construir objeto User com agent_id do agent
      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.full_name || response.user.email,
        role: response.user.role,
        avatar_url: response.user.avatar_url,
        is_active: response.user.is_active,
        agent_id: response.agent?.id,  // CRITICAL: extrair agent_id do agent
        agency_id: response.agent?.agency_id,
      };
      
      console.log('[AuthService] User loaded with agent_id:', user.agent_id);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      await this.logout();
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return false;

      // CRITICAL: Incluir X-Tenant-Slug para multi-tenant
      const tenantSlug = getTenantSlug();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tenantSlug) {
        headers['X-Tenant-Slug'] = tenantSlug;
      }

      // POST /auth/refresh retorna novo par de tokens (token rotation)
      const response = await fetch(`${apiService['baseURL']}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh token inválido');
      }

      const data = await response.json();

      // Atualizar AMBOS os tokens (token rotation)
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      await AsyncStorage.setItem('expires_at', data.expires_at);

      apiService.setAccessToken(data.access_token);

      return true;
    } catch {
      await this.logout();
      return false;
    }
  }
}

export const authService = new AuthService();
