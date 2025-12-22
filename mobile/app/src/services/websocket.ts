/**
 * ✨ FASE 2: WebSocket Real-Time Notifications
 * Notificações push real-time (new_lead, visit_scheduled, visit_reminder)
 */

import { API_CONFIG } from '../constants/config';

export type WebSocketEventType =
  | 'connected'
  | 'pong'
  | 'new_lead'
  | 'visit_scheduled'
  | 'visit_reminder'
  | 'error';

export interface WebSocketEvent {
  type: WebSocketEventType;
  title?: string;
  body?: string;
  message?: string;
  data?: any;
  timestamp: string;
  sound?: 'default' | 'alarm';
  priority?: 'normal' | 'high';
}

type EventCallback = (event: WebSocketEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private listeners: Map<WebSocketEventType | '*', EventCallback[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isConnected: boolean = false;

  constructor() {
    // Converter HTTP URL para WebSocket URL
    const httpUrl = API_CONFIG.BASE_URL;
    this.url = httpUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    console.log('[WebSocket] 🔧 Inicializado com URL:', this.url);
  }

  /**
   * Conectar ao WebSocket com token JWT
   */
  connect(accessToken: string) {
    if (this.ws && this.isConnected) {
      console.log('[WebSocket] ⚠️ Já está conectado');
      return;
    }

    this.token = accessToken;
    this.reconnectAttempts = 0;
    this._connect();
  }

  private _connect() {
    if (!this.token) {
      console.error('[WebSocket] ❌ Token não definido');
      return;
    }

    const wsUrl = `${this.url}/mobile/ws?token=${this.token}`;
    console.log('[WebSocket] 🔌 Conectando...');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] ✅ Conectado');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Ping a cada 30s para manter conexão viva
        this.startPingInterval();

        // Notificar listeners de 'connected'
        this.emit({
          type: 'connected',
          message: 'WebSocket conectado',
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          console.log('[WebSocket] 📩 Mensagem recebida:', data.type, data.title || data.message);

          // Notificar listeners específicos do tipo
          this.emit(data);

          // Notificar listeners globais ('*')
          const globalListeners = this.listeners.get('*') || [];
          globalListeners.forEach(callback => callback(data));
        } catch (error) {
          console.error('[WebSocket] ❌ Erro ao parsear mensagem:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] ❌ Erro:', error);
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] 🔌 Desconectado');
        this.isConnected = false;
        this.stopPingInterval();

        // Tentar reconectar (com backoff exponencial)
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`[WebSocket] 🔄 Reconnecting em ${delay / 1000}s (tentativa ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

          this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempts++;
            this._connect();
          }, delay);
        } else {
          console.error('[WebSocket] ❌ Max reconnect attempts atingido');
          this.emit({
            type: 'error',
            message: 'Falha ao conectar ao servidor. Tente novamente mais tarde.',
            timestamp: new Date().toISOString(),
          });
        }
      };
    } catch (error) {
      console.error('[WebSocket] ❌ Erro ao criar conexão:', error);
    }
  }

  /**
   * Desconectar WebSocket
   */
  disconnect() {
    console.log('[WebSocket] 🔌 Desconectando...');

    this.stopPingInterval();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.listeners.clear();
  }

  /**
   * Enviar ping para manter conexão viva
   */
  private startPingInterval() {
    this.stopPingInterval();

    this.pingInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        console.log('[WebSocket] 🏓 Ping...');
        this.ws.send('ping');
      }
    }, 30000); // 30 segundos
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Registar listener para eventos
   * 
   * @param eventType - Tipo de evento ('new_lead', 'visit_scheduled', etc) ou '*' para todos
   * @param callback - Função a chamar quando evento ocorrer
   */
  on(eventType: WebSocketEventType | '*', callback: EventCallback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    console.log(`[WebSocket] 👂 Listener adicionado para '${eventType}'`);
  }

  /**
   * Remover listener
   */
  off(eventType: WebSocketEventType | '*', callback: EventCallback) {
    const listeners = this.listeners.get(eventType) || [];
    const index = listeners.indexOf(callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
      console.log(`[WebSocket] 🔇 Listener removido de '${eventType}'`);
    }
  }

  /**
   * Emitir evento para listeners
   */
  private emit(event: WebSocketEvent) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(callback => callback(event));
  }

  /**
   * Verificar se está conectado
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Atualizar token (após refresh)
   */
  updateToken(newToken: string) {
    if (this.token !== newToken) {
      console.log('[WebSocket] 🔑 Token atualizado, reconnecting...');
      this.token = newToken;
      
      // Disconnect e reconnect com novo token
      this.disconnect();
      this.connect(newToken);
    }
  }
}

export const webSocketService = new WebSocketService();
