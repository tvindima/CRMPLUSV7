/**
 * Context de autenticação global
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';
import type { User } from '../types';

export interface AuthContextData {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const currentUser = await authService.getCurrentUser();
      
      // FORÇAR LOGOUT SE TOKEN É MOCKADO
      const token = await authService.getAccessToken();
      setAccessToken(token);
      
      if (token?.startsWith('mock-jwt-token')) {
        console.warn('[AUTH CONTEXT] ⚠️ Token mockado detectado! Forçando logout...');
        await signOut();
        return;
      }
      
      // VALIDAR SE TOKEN TEM agent_id (crítico para criar leads)
      if (token) {
        try {
          // Decodificar JWT para verificar payload
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          if (!payload.agent_id) {
            console.warn('[AUTH CONTEXT] ⚠️ Token sem agent_id detectado! Forçando logout para renovação...');
            await signOut();
            return;
          }
          
          console.log('[AUTH CONTEXT] ✅ Token válido com agent_id:', payload.agent_id);
        } catch (decodeError) {
          console.error('[AUTH CONTEXT] Erro ao decodificar token:', decodeError);
        }
      }
      
      setUser(currentUser);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(username: string, password: string) {
    const loggedUser = await authService.login({ username, password });
    const token = await authService.getAccessToken();
    setAccessToken(token);
    setUser(loggedUser);
  }

  async function signOut() {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
  }

  async function refreshUser() {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
