'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  sector: string;
  is_active: boolean;
  plan: string;
  max_users: number;
  max_properties: number;
  settings: Record<string, any>;
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    is_active: true,
    plan: 'basic',
    max_users: 5,
    max_properties: 100,
  });

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  const fetchTenant = async () => {
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
        setFormData({
          name: data.name || '',
          domain: data.domain || '',
          is_active: data.is_active ?? true,
          plan: data.plan || 'basic',
          max_users: data.max_users || 5,
          max_properties: data.max_properties || 100,
        });
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError('Erro ao carregar tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/tenants/${tenantId}`);
      } else {
        const data = await res.json();
        setError(data.detail || 'Erro ao guardar');
      }
    } catch (err) {
      console.error('Error saving tenant:', err);
      setError('Erro ao guardar tenant');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/tenants/${tenantId}`} className="text-blue-600 hover:underline">
          ← Voltar ao tenant
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Editar Tenant: {tenant.name}</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (não editável)
            </label>
            <input
              type="text"
              value={tenant.slug}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domínio Personalizado
            </label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="exemplo.com"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máx. Utilizadores
              </label>
              <input
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                min="1"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máx. Imóveis/Items
              </label>
              <input
                type="number"
                value={formData.max_properties}
                onChange={(e) => setFormData({ ...formData, max_properties: parseInt(e.target.value) })}
                min="1"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Tenant Ativo
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
            <Link
              href={`/tenants/${tenantId}`}
              className="flex-1 text-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
