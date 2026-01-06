'use client';

import { useState } from 'react';

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const tenants = [
    { 
      id: 1, 
      name: 'Imóveis Mais', 
      domain: 'imoveismais.com',
      backoffice: 'backoffice.imoveismais.com',
      status: 'active',
      plan: 'Professional',
      agents: 12,
      properties: 87,
      leads: 423,
      railway: 'fortunate-grace',
      database: 'railway/fortunate-grace',
      monthlyFee: 99,
      createdAt: '2024-06-15',
      lastActivity: '2026-01-06'
    },
    { 
      id: 2, 
      name: 'Luis Carlos Gaspar Team', 
      domain: 'luiscarlosgaspar.com',
      backoffice: 'backoffice.luiscarlosgaspar.com',
      status: 'active',
      plan: 'Professional',
      agents: 8,
      properties: 69,
      leads: 312,
      railway: 'triumphant-energy',
      database: 'railway/triumphant-energy',
      monthlyFee: 99,
      createdAt: '2024-09-20',
      lastActivity: '2026-01-06'
    },
  ];

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.domain.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Tenants</h1>
          <p className="text-white/50 text-sm mt-1">Gestão de imobiliárias na plataforma</p>
        </div>
        <a 
          href="/s/tenants/novo"
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          + Novo Tenant
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar tenants..."
          className="flex-1 px-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white placeholder-white/30"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-[#111] border border-[#222] rounded-lg text-white"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="trial">Em Trial</option>
          <option value="suspended">Suspensos</option>
        </select>
      </div>

      {/* Tenants Grid */}
      <div className="grid gap-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="bg-[#111] border border-[#222] rounded-xl p-6 hover:border-[#333] transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-xl">
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{tenant.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      tenant.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      tenant.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                    <span>🌐 {tenant.domain}</span>
                    <span>💼 {tenant.plan}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-400">€{tenant.monthlyFee}/mês</div>
                <div className="text-xs text-white/40">Desde {tenant.createdAt}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#222]">
              <div>
                <div className="text-2xl font-bold">{tenant.agents}</div>
                <div className="text-xs text-white/40">Agentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{tenant.properties}</div>
                <div className="text-xs text-white/40">Propriedades</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{tenant.leads}</div>
                <div className="text-xs text-white/40">Leads</div>
              </div>
              <div>
                <div className="text-xs text-white/40 mb-1">Última atividade</div>
                <div className="text-sm">{tenant.lastActivity}</div>
              </div>
            </div>

            {/* Infrastructure */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#222] text-xs text-white/40">
              <span className="font-mono">🚂 Railway: {tenant.railway}</span>
              <span className="font-mono">🗄️ DB: {tenant.database}</span>
              <span>🌐 Backoffice: {tenant.backoffice}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <a 
                href={`/s/tenants/${tenant.id}`}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
              >
                Ver detalhes
              </a>
              <a 
                href={`https://${tenant.backoffice}`}
                target="_blank"
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition"
              >
                Abrir Backoffice ↗
              </a>
              <a 
                href={`https://${tenant.domain}`}
                target="_blank"
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition"
              >
                Ver Site ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
