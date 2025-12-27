"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

interface User {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar token do localStorage e validar
    const savedToken = localStorage.getItem("client_token");
    if (savedToken) {
      validateToken(savedToken);
    } else {
      setIsLoading(false);
    }

    // Listener para mudanças de autenticação
    const handleAuthChange = () => {
      const savedToken = localStorage.getItem("client_token");
      if (savedToken) {
        validateToken(savedToken);
      } else {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChange", handleAuthChange);
    
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch(`${API_BASE}/website/auth/validate?token=${tokenToValidate}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(tokenToValidate);
      } else {
        // Token inválido - limpar
        localStorage.removeItem("client_token");
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error("[Auth] Erro ao validar token:", err);
      // Em caso de erro de rede, manter dados locais
      const savedUser = localStorage.getItem("client_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(tokenToValidate);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/website/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao fazer login");
      }

      const data = await response.json();
      
      // Guardar token e dados do cliente
      localStorage.setItem("client_token", data.access_token);
      localStorage.setItem("client_user", JSON.stringify(data.client));
      
      setToken(data.access_token);
      setUser(data.client);
      
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/website/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao registar");
      }

      const data = await response.json();
      
      // Guardar token e dados do cliente
      localStorage.setItem("client_token", data.access_token);
      localStorage.setItem("client_user", JSON.stringify(data.client));
      
      setToken(data.access_token);
      setUser(data.client);
      
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registar";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
    setUser(null);
    setToken(null);
    window.dispatchEvent(new Event("authChange"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
