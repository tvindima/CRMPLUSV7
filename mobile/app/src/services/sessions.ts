/**
 * ✨ FASE 2: Multi-Device Session Management
 * Gerir dispositivos onde utilizador está logado
 */

import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

export interface DeviceSession {
  id: number;
  device_name: string;
  device_type: 'iOS' | 'Android' | 'Desktop' | string;
  ip_address: string;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}

export interface RevokeAllResponse {
  message: string;
  revoked_sessions: number;
  current_device: string;
}

class SessionService {
  /**
   * Listar todos os dispositivos ativos do utilizador
   * 
   * @returns Array de sessões ativas
   */
  async listSessions(): Promise<DeviceSession[]> {
    console.log('[Sessions] 📱 Listando dispositivos ativos...');

    // Obter refresh token para marcar sessão atual
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    const sessions = await apiService.get<DeviceSession[]>('/auth/sessions', {
      headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : undefined,
    } as any);

    console.log(`[Sessions] ✅ ${sessions.length} dispositivo(s) ativo(s)`);
    return sessions;
  }

  /**
   * Fazer logout de dispositivo específico
   * 
   * @param sessionId - ID da sessão a revogar
   * @returns Mensagem de confirmação
   */
  async revokeSession(sessionId: number): Promise<{ message: string; device_name: string }> {
    console.log(`[Sessions] 🗑️ Revogando sessão ${sessionId}...`);

    const result = await apiService.delete<{
      message: string;
      device_name: string;
      device_type: string;
    }>(`/auth/sessions/${sessionId}`);

    console.log(`[Sessions] ✅ Logout efetuado: ${result.device_name}`);
    return {
      message: result.message,
      device_name: result.device_name,
    };
  }

  /**
   * Fazer logout de TODOS os dispositivos EXCETO o atual
   * 
   * @returns Número de sessões revogadas
   */
  async revokeAllOtherSessions(): Promise<RevokeAllResponse> {
    console.log('[Sessions] 🗑️🗑️ Revogando todas as outras sessões...');

    // Obter refresh token para proteger sessão atual
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const result = await apiService.post<RevokeAllResponse>(
      '/auth/sessions/revoke-all',
      {},
      {
        headers: { 'X-Refresh-Token': refreshToken },
      } as any
    );

    console.log(`[Sessions] ✅ ${result.revoked_sessions} sessão(ões) revogada(s)`);
    return result;
  }

  /**
   * Obter informação do dispositivo atual (para enviar no login)
   * React Native: Platform.OS + Device info
   */
  getDeviceInfo(): { device_name: string; device_type: string; device_info: string } {
    // TODO: Implementar detecção real com expo-device ou react-native-device-info
    // Por agora, retornar placeholder
    
    const Platform = require('react-native').Platform;
    
    return {
      device_name: `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`,
      device_type: Platform.OS === 'ios' ? 'iOS' : 'Android',
      device_info: `${Platform.OS} ${Platform.Version}`,
    };
  }
}

export const sessionService = new SessionService();
