'use client';

import { useState } from 'react';

export default function LogsPage() {
  const [filter, setFilter] = useState('all');

  const logs = [
    { id: 1, type: 'info', message: 'Tenant "Imóveis Mais" - Login de admin@imoveismais.com', time: '2026-01-06 22:45:12', tenant: 'Imóveis Mais' },
    { id: 2, type: 'info', message: 'Tenant "Luis Carlos Gaspar" - Nova propriedade criada #P-2431', time: '2026-01-06 22:30:05', tenant: 'Luis Carlos Gaspar' },
    { id: 3, type: 'success', message: 'Deploy automático - Backend Imóveis Mais completado', time: '2026-01-06 22:22:16', tenant: 'System' },
    { id: 4, type: 'info', message: 'Tenant "Imóveis Mais" - Logout de staff@imoveismais.com', time: '2026-01-06 21:15:33', tenant: 'Imóveis Mais' },
    { id: 5, type: 'warning', message: 'Rate limit atingido - API Imóveis Mais (100 req/min)', time: '2026-01-06 20:45:00', tenant: 'Imóveis Mais' },
  ];

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">System Logs</h1>
          <p className="text-white/50 text-sm mt-1">Atividade da plataforma</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white"
        >
          <option value="all">Todos</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#222]">
          {filteredLogs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-white/5 flex items-start gap-4">
              <span className={`mt-1 w-2 h-2 rounded-full ${
                log.type === 'info' ? 'bg-blue-400' :
                log.type === 'success' ? 'bg-green-400' :
                log.type === 'warning' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm">{log.message}</p>
                <div className="flex gap-4 mt-1 text-xs text-white/40">
                  <span>{log.time}</span>
                  <span>• {log.tenant}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
