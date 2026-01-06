'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    platformName: 'CRM Plus',
    supportEmail: 'suporte@crmplus.pt',
    defaultPlan: 'professional',
    trialDays: 14,
    maxAgentsStarter: 3,
    maxAgentsProfessional: 15,
    maintenanceMode: false,
  });

  const handleSave = () => {
    alert('Settings guardados! (simulação)');
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-white/50 text-sm mt-1">Configurações da plataforma</p>
      </div>

      <div className="space-y-6">
        {/* General */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="font-medium mb-4">Geral</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/50 block mb-1">Nome da Plataforma</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings(s => ({ ...s, platformName: e.target.value }))}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/50 block mb-1">Email de Suporte</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings(s => ({ ...s, supportEmail: e.target.value }))}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
              />
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="font-medium mb-4">Planos</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/50 block mb-1">Plano Default para novos Tenants</label>
              <select
                value={settings.defaultPlan}
                onChange={(e) => setSettings(s => ({ ...s, defaultPlan: e.target.value }))}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
              >
                <option value="starter">Starter (€49/mês)</option>
                <option value="professional">Professional (€99/mês)</option>
                <option value="enterprise">Enterprise (€199/mês)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/50 block mb-1">Dias de Trial</label>
                <input
                  type="number"
                  value={settings.trialDays}
                  onChange={(e) => setSettings(s => ({ ...s, trialDays: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Max Agentes (Starter)</label>
                <input
                  type="number"
                  value={settings.maxAgentsStarter}
                  onChange={(e) => setSettings(s => ({ ...s, maxAgentsStarter: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="font-medium mb-4">Manutenção</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Modo Manutenção</div>
              <p className="text-sm text-white/50">Desativa acesso de todos os tenants</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-red-500' : 'bg-[#333]'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition"
        >
          💾 Guardar Configurações
        </button>
      </div>
    </div>
  );
}
