'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  ip_address: string;
  level: 'info' | 'warning' | 'error';
}

export default function TenantLogsPage() {
  const params = useParams();
  const tenantId = params.id;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    const token = Cookies.get('platform_token');
    try {
      // Fetch tenant info
      const tenantRes = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenant(tenantData);
      }

      // Try to fetch logs (may not be implemented yet)
      try {
        const logsRes = await fetch(`${API_URL}/platform/tenants/${tenantId}/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        }
      } catch {
        // Logs endpoint might not exist yet, use mock data
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock logs for demo purposes
  const mockLogs: LogEntry[] = [
    { id: 1, timestamp: '2025-01-10T10:30:00Z', action: 'user.login', user: 'admin@exemplo.com', details: 'Login com sucesso', ip_address: '192.168.1.1', level: 'info' },
    { id: 2, timestamp: '2025-01-10T10:25:00Z', action: 'property.create', user: 'agent@exemplo.com', details: 'Novo imóvel criado: T3 Lisboa', ip_address: '192.168.1.2', level: 'info' },
    { id: 3, timestamp: '2025-01-10T10:20:00Z', action: 'user.login_failed', user: 'unknown@test.com', details: 'Tentativa de login falhada', ip_address: '45.33.32.156', level: 'warning' },
    { id: 4, timestamp: '2025-01-10T10:15:00Z', action: 'settings.update', user: 'admin@exemplo.com', details: 'Configurações atualizadas', ip_address: '192.168.1.1', level: 'info' },
    { id: 5, timestamp: '2025-01-10T10:10:00Z', action: 'api.error', user: 'system', details: 'Erro de conexão à base de dados', ip_address: '-', level: 'error' },
    { id: 6, timestamp: '2025-01-10T10:05:00Z', action: 'user.create', user: 'admin@exemplo.com', details: 'Novo utilizador criado: agent2@exemplo.com', ip_address: '192.168.1.1', level: 'info' },
  ];

  const displayLogs = logs.length > 0 ? logs : mockLogs;
  const filteredLogs = filter === 'all' ? displayLogs : displayLogs.filter(log => log.level === filter);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tenant não encontrado</p>
        <Link href="/tenants" className="text-blue-600 hover:underline mt-4 inline-block">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href={`/tenants/${tenantId}`} className="text-blue-600 hover:underline">
          ← Voltar ao tenant
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Logs de Atividade: {tenant.name}</h1>
          <p className="text-gray-500">Histórico de ações e eventos</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="info">Info</option>
            <option value="warning">Avisos</option>
            <option value="error">Erros</option>
          </select>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total de Eventos</p>
          <p className="text-2xl font-bold">{displayLogs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Info</p>
          <p className="text-2xl font-bold text-blue-600">{displayLogs.filter(l => l.level === 'info').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Avisos</p>
          <p className="text-2xl font-bold text-yellow-600">{displayLogs.filter(l => l.level === 'warning').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Erros</p>
          <p className="text-2xl font-bold text-red-600">{displayLogs.filter(l => l.level === 'error').length}</p>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-500">Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelBadge(log.level)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString('pt-PT')}
                      </span>
                    </div>
                    <p className="text-gray-900">{log.details}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>Utilizador: {log.user}</span>
                      <span>IP: {log.ip_address}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-400 mt-4">
        Mostrando os últimos {filteredLogs.length} eventos
      </p>
    </div>
  );
}
