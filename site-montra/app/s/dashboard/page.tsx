'use client';

import { useState, useEffect } from 'react';

interface TenantStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
}

interface SystemStats {
  totalProperties: number;
  totalAgents: number;
  totalLeads: number;
  monthlyRevenue: number;
}

export default function SuperDashboard() {
  const [tenantStats, setTenantStats] = useState<TenantStats>({
    total: 0, active: 0, trial: 0, suspended: 0
  });
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalProperties: 0, totalAgents: 0, totalLeads: 0, monthlyRevenue: 0
  });

  useEffect(() => {
    // TODO: Fetch real data from API
    // Mock data para desenvolvimento
    setTenantStats({ total: 2, active: 2, trial: 0, suspended: 0 });
    setSystemStats({ 
      totalProperties: 156, 
      totalAgents: 24, 
      totalLeads: 1847,
      monthlyRevenue: 598 
    });
  }, []);

  const tenants = [
    { 
      id: 1, 
      name: 'Imóveis Mais', 
      domain: 'imoveismais.com',
      status: 'active',
      plan: 'Professional',
      agents: 12,
      properties: 87,
      railway: 'fortunate-grace',
      createdAt: '2024-06-15'
    },
    { 
      id: 2, 
      name: 'Luis Carlos Gaspar Team', 
      domain: 'luiscarlosgaspar.com',
      status: 'active',
      plan: 'Professional',
      agents: 8,
      properties: 69,
      railway: 'triumphant-energy',
      createdAt: '2024-09-20'
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-white/50 text-sm mt-1">Visão geral de todos os tenants</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">Total Tenants</div>
          <div className="text-3xl font-bold">{tenantStats.total}</div>
          <div className="text-xs text-green-400 mt-2">+{tenantStats.active} ativos</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">Total Propriedades</div>
          <div className="text-3xl font-bold">{systemStats.totalProperties}</div>
          <div className="text-xs text-white/30 mt-2">em todos os tenants</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">Total Agentes</div>
          <div className="text-3xl font-bold">{systemStats.totalAgents}</div>
          <div className="text-xs text-white/30 mt-2">utilizadores ativos</div>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="text-white/40 text-sm mb-1">Receita Mensal</div>
          <div className="text-3xl font-bold text-green-400">€{systemStats.monthlyRevenue}</div>
          <div className="text-xs text-white/30 mt-2">MRR</div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center">
          <h2 className="font-semibold">Tenants</h2>
          <a 
            href="/s/tenants/novo"
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            + Novo Tenant
          </a>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-white/40 border-b border-[#222]">
              <th className="px-6 py-3">Tenant</th>
              <th className="px-6 py-3">Domínio</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Plano</th>
              <th className="px-6 py-3">Agentes</th>
              <th className="px-6 py-3">Propriedades</th>
              <th className="px-6 py-3">Railway</th>
              <th className="px-6 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-b border-[#222] hover:bg-white/5">
                <td className="px-6 py-4">
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-xs text-white/40">Desde {tenant.createdAt}</div>
                </td>
                <td className="px-6 py-4 text-sm text-white/70">{tenant.domain}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    tenant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    tenant.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{tenant.plan}</td>
                <td className="px-6 py-4 text-sm">{tenant.agents}</td>
                <td className="px-6 py-4 text-sm">{tenant.properties}</td>
                <td className="px-6 py-4 text-xs text-white/50 font-mono">{tenant.railway}</td>
                <td className="px-6 py-4">
                  <a 
                    href={`/s/tenants/${tenant.id}`}
                    className="text-sm text-pink-400 hover:text-pink-300"
                  >
                    Ver →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <a href="/s/tenants/novo" className="bg-[#111] border border-[#222] rounded-xl p-6 hover:border-pink-500/50 transition group">
          <div className="text-2xl mb-2">🏢</div>
          <div className="font-medium group-hover:text-pink-400 transition">Criar Novo Tenant</div>
          <div className="text-sm text-white/40 mt-1">Provisionar nova imobiliária</div>
        </a>
        <a href="/s/support" className="bg-[#111] border border-[#222] rounded-xl p-6 hover:border-purple-500/50 transition group">
          <div className="text-2xl mb-2">🎫</div>
          <div className="font-medium group-hover:text-purple-400 transition">Tickets Suporte</div>
          <div className="text-sm text-white/40 mt-1">0 tickets pendentes</div>
        </a>
        <a href="/s/logs" className="bg-[#111] border border-[#222] rounded-xl p-6 hover:border-blue-500/50 transition group">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-medium group-hover:text-blue-400 transition">System Logs</div>
          <div className="text-sm text-white/40 mt-1">Ver atividade da plataforma</div>
        </a>
      </div>
    </div>
  );
}
