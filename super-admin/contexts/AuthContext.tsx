'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface SuperAdmin {
  id: number;
  email: string;
  name: string;
  permissions?: Record<string, boolean>;
}

interface AuthContextType {
  superAdmin: SuperAdmin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar auth do cookie
  useEffect(() => {
    const storedToken = Cookies.get('platform_token');
    const storedAdmin = Cookies.get('super_admin');

    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setSuperAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        console.error('Erro ao restaurar sessão:', e);
        // Limpar cookies inválidos
        Cookies.remove('platform_token');
        Cookies.remove('super_admin');
      }
    }
    setIsLoading(false);
  }, []);

  // Verificar se token é válido e não expirou
  const validateToken = useCallback((tokenToValidate: string): boolean => {
    try {
      const parts = tokenToValidate.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (exp && Date.now() >= exp * 1000) {
        return false; // Expirado
      }
      
      return true;
    } catch {
      return false;
    }
  }, []);

  // Função de login
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/platform/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || 'Credenciais inválidas');
    }

    const data = await response.json();
    
    // Guardar em cookies (7 dias)
    Cookies.set('platform_token', data.access_token, { expires: 7, secure: true, sameSite: 'strict' });
    Cookies.set('super_admin', JSON.stringify(data.super_admin), { expires: 7, secure: true, sameSite: 'strict' });

    setToken(data.access_token);
    setSuperAdmin(data.super_admin);
  }, []);

  // Função de logout
  const logout = useCallback(() => {
    Cookies.remove('platform_token');
    Cookies.remove('super_admin');
    setToken(null);
    setSuperAdmin(null);
    router.push('/login');
  }, [router]);

  // Refresh auth - verificar se ainda está válido
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const currentToken = Cookies.get('platform_token');
    
    if (!currentToken || !validateToken(currentToken)) {
      logout();
      return false;
    }

    // Opcionalmente, validar token com o servidor
    try {
      const response = await fetch(`${API_URL}/platform/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const adminData = await response.json();
      setSuperAdmin(adminData);
      Cookies.set('super_admin', JSON.stringify(adminData), { expires: 7, secure: true, sameSite: 'strict' });
      
      return true;
    } catch (e) {
      console.error('Erro ao validar sessão:', e);
      return true; // Não fazer logout em caso de erro de rede
    }
  }, [validateToken, logout]);

  const value: AuthContextType = {
    superAdmin,
    token,
    isLoading,
    isAuthenticated: !!token && !!superAdmin,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
