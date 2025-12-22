/**
 * ✨ FASE 2: WebSocket Provider
 * Context para gerir WebSocket real-time notifications em toda a app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { webSocketService, WebSocketEvent, WebSocketEventType } from '../services/websocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  on: (eventType: WebSocketEventType | '*', callback: (event: WebSocketEvent) => void) => void;
  off: (eventType: WebSocketEventType | '*', callback: (event: WebSocketEvent) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    // Apenas conectar se estiver autenticado
    if (!isAuthenticated || !accessToken) {
      console.log('[WebSocketProvider] ⏸️ User não autenticado, não conectar WebSocket');
      webSocketService.disconnect();
      setIsConnected(false);
      return;
    }

    console.log('[WebSocketProvider] 🚀 Conectando WebSocket...');
    webSocketService.connect(accessToken);

    // Listener para atualizar estado de conexão
    const handleConnected = () => {
      console.log('[WebSocketProvider] ✅ WebSocket conectado');
      setIsConnected(true);
    };

    const handleError = () => {
      console.log('[WebSocketProvider] ❌ WebSocket erro');
      setIsConnected(false);
    };

    webSocketService.on('connected', handleConnected);
    webSocketService.on('error', handleError);

    // Cleanup ao desmontar
    return () => {
      console.log('[WebSocketProvider] 🔌 Cleanup: desconectando WebSocket');
      webSocketService.off('connected', handleConnected);
      webSocketService.off('error', handleError);
      webSocketService.disconnect();
    };
  }, [accessToken, isAuthenticated]);

  // Atualizar token do WebSocket quando mudar (após refresh)
  useEffect(() => {
    if (accessToken && isAuthenticated) {
      webSocketService.updateToken(accessToken);
    }
  }, [accessToken, isAuthenticated]);

  const contextValue: WebSocketContextType = {
    isConnected,
    on: webSocketService.on.bind(webSocketService),
    off: webSocketService.off.bind(webSocketService),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook para usar WebSocket em qualquer componente
 * 
 * @example
 * ```tsx
 * const { isConnected, on, off } = useWebSocket();
 * 
 * useEffect(() => {
 *   const handleNewLead = (event: WebSocketEvent) => {
 *     Alert.alert(event.title!, event.body!);
 *   };
 *   
 *   on('new_lead', handleNewLead);
 *   
 *   return () => off('new_lead', handleNewLead);
 * }, []);
 * ```
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  
  return context;
}
