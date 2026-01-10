'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  X,
  Loader2,
  Globe,
  Mail,
  Phone,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface Tenant {
  id: number;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  primary_domain: string | null;
  backoffice_domain: string | null;
  plan: string;
  max_agents: number;
  max_properties: number;
  is_active: boolean;
  is_trial: boolean;
  created_at: string;
}

const PLANS = ['basic', 'pro', 'enterprise'];

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

  // Form state
  const [form, setForm] = useState({
    slug: '',
    name: '',
    email: '',
    phone: '',
    primary_domain: '',
    backoffice_domain: '',
    plan: 'basic',
    max_agents: 10,
    max_properties: 100,
    is_trial: false,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setForm({
      slug: '',
      name: '',
      email: '',
      phone: '',
      primary_domain: '',
      backoffice_domain: '',
      plan: 'basic',
      max_agents: 10,
      max_properties: 100,
      is_trial: false,
    });
    setShowModal(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setForm({
      slug: tenant.slug,
      name: tenant.name,
      email: tenant.email || '',
      phone: tenant.phone || '',
      primary_domain: tenant.primary_domain || '',
      backoffice_domain: tenant.backoffice_domain || '',
      plan: tenant.plan,
      max_agents: tenant.max_agents,
      max_properties: tenant.max_properties,
      is_trial: tenant.is_trial,
    });
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSave = async () => {
    const token = Cookies.get('platform_token');
    setSaving(true);

    try {
      const url = editingTenant
        ? `${API_URL}/platform/tenants/${editingTenant.id}`
        : `${API_URL}/platform/tenants`;

      const res = await fetch(url, {
        method: editingTenant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || 'Erro ao guardar tenant');
        return;
      }

      setShowModal(false);
      fetchTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      alert('Erro ao guardar tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !tenant.is_active })
      });

      if (res.ok) {
        fetchTenants();
      }
    } catch (error) {
      console.error('Error toggling tenant:', error);
    }
    setMenuOpen(null);
  };

  const handleDelete = async (tenant: Tenant) => {
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/tenants/${tenant.id}?permanent=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeletingTenant(null);
        fetchTenants();
      } else {
        const error = await res.json();
        alert(error.detail || 'Erro ao eliminar tenant');
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Erro ao eliminar tenant');
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      t.primary_domain?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Pesquisar tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Tenant
        </button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-background-secondary rounded-xl border border-border overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tenant.name}</h3>
                    <p className="text-sm text-text-muted">{tenant.slug}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === tenant.id ? null : tenant.id)}
                    className="p-2 text-text-muted hover:text-white hover:bg-background rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpen === tenant.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-10">
                      <button
                        onClick={() => openEditModal(tenant)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-text-muted hover:text-white hover:bg-background-secondary transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(tenant)}
                        className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                          tenant.is_active
                            ? 'text-warning hover:bg-warning/10'
                            : 'text-success hover:bg-success/10'
                        }`}
                      >
                        {tenant.is_active ? (
                          <>
                            <PowerOff className="w-4 h-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setDeletingTenant(tenant);
                          setMenuOpen(null);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {tenant.primary_domain && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Globe className="w-4 h-4" />
                    <span>{tenant.primary_domain}</span>
                  </div>
                )}
                {tenant.email && (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Mail className="w-4 h-4" />
                    <span>{tenant.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 bg-background/50 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  tenant.plan === 'enterprise' ? 'bg-primary/20 text-primary' :
                  tenant.plan === 'pro' ? 'bg-secondary/20 text-secondary' :
                  'bg-text-muted/20 text-text-muted'
                }`}>
                  {tenant.plan}
                </span>
                {tenant.is_trial && (
                  <span className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">
                    Trial
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${tenant.is_active ? 'bg-success' : 'bg-danger'}`} />
                <span className="text-xs text-text-muted">
                  {tenant.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">Nenhum tenant encontrado</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-white">
                {editingTenant ? 'Editar Tenant' : 'Novo Tenant'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-text-muted hover:text-white hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    disabled={!!editingTenant}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
                    placeholder="imobiliaria-xyz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    placeholder="Imobiliária XYZ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    placeholder="geral@imobiliaria.pt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Domínio Principal
                </label>
                <input
                  type="text"
                  value={form.primary_domain}
                  onChange={(e) => setForm({ ...form, primary_domain: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  placeholder="imobiliaria.pt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Domínio Backoffice
                </label>
                <input
                  type="text"
                  value={form.backoffice_domain}
                  onChange={(e) => setForm({ ...form, backoffice_domain: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  placeholder="backoffice.imobiliaria.pt"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Plano
                  </label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    {PLANS.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Max. Agentes
                  </label>
                  <input
                    type="number"
                    value={form.max_agents}
                    onChange={(e) => setForm({ ...form, max_agents: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Max. Imóveis
                  </label>
                  <input
                    type="number"
                    value={form.max_properties}
                    onChange={(e) => setForm({ ...form, max_properties: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_trial"
                  checked={form.is_trial}
                  onChange={(e) => setForm({ ...form, is_trial: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
                />
                <label htmlFor="is_trial" className="text-sm text-text-muted">
                  Em período de trial
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-text-muted hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.slug || !form.name}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingTenant ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Eliminar Tenant</h3>
                <p className="text-sm text-text-muted">{deletingTenant.name}</p>
              </div>
            </div>
            <p className="text-text-muted mb-6">
              Tem a certeza que deseja eliminar este tenant? Esta ação é <span className="text-danger font-semibold">irreversível</span> e todos os dados serão perdidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingTenant(null)}
                className="flex-1 px-4 py-2 bg-background border border-border text-white rounded-lg hover:bg-background/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingTenant)}
                className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
