'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Settings,
  Save,
  Loader2,
  Database,
  Mail,
  Shield,
  Bell,
  Palette,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface PlatformSettings {
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_plan: string;
  trial_days: number;
  support_email: string;
  platform_name: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    maintenance_mode: false,
    registration_enabled: true,
    default_plan: 'basic',
    trial_days: 14,
    support_email: 'suporte@crmplusv7.pt',
    platform_name: 'CRM+ Platform',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...settings, ...data });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = Cookies.get('platform_token');
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`${API_URL}/platform/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const error = await res.json();
        alert(error.detail || 'Erro ao guardar definições');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erro ao guardar definições');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General Settings */}
      <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Definições Gerais</h2>
              <p className="text-sm text-text-muted">Configurações básicas da plataforma</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Nome da Plataforma
            </label>
            <input
              type="text"
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Email de Suporte
            </label>
            <input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Registration Settings */}
      <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Registo de Tenants</h2>
              <p className="text-sm text-text-muted">Configurações de registo e trial</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Permitir Novos Registos</p>
              <p className="text-sm text-text-muted">
                Permitir que novos tenants se registem na plataforma
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, registration_enabled: !settings.registration_enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.registration_enabled ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  settings.registration_enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Plano Padrão
              </label>
              <select
                value={settings.default_plan}
                onChange={(e) => setSettings({ ...settings, default_plan: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Dias de Trial
              </label>
              <input
                type="number"
                value={settings.trial_days}
                onChange={(e) => setSettings({ ...settings, trial_days: parseInt(e.target.value) || 14 })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Manutenção</h2>
              <p className="text-sm text-text-muted">Modo de manutenção da plataforma</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Modo de Manutenção</p>
              <p className="text-sm text-text-muted">
                Quando activo, apenas super admins podem aceder à plataforma
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.maintenance_mode ? 'bg-warning' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  settings.maintenance_mode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          {settings.maintenance_mode && (
            <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                ⚠️ O modo de manutenção está activo. Os tenants não conseguem aceder às suas contas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="text-success text-sm">✓ Definições guardadas com sucesso</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-lg transition-colors"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Guardar Definições
        </button>
      </div>
    </div>
  );
}
