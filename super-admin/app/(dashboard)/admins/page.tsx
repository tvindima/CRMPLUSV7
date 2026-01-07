'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Mail,
  User,
  Check,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface SuperAdmin {
  id: number;
  email: string;
  name: string | null;
  is_active: boolean;
  permissions: Record<string, boolean> | string[] | null;
  created_at: string;
  last_login: string | null;
}

// Helper para converter permissões para array
const permissionsToArray = (permissions: Record<string, boolean> | string[] | null): string[] => {
  if (!permissions) return [];
  if (Array.isArray(permissions)) return permissions;
  // Se for objeto com "all: true", retorna todas as permissões
  if (permissions.all === true) {
    return ALL_PERMISSIONS;
  }
  // Se for objeto, retorna as chaves que têm valor true
  return Object.entries(permissions)
    .filter(([_, value]) => value === true)
    .map(([key]) => key);
};

// Helper para converter array para objeto
const permissionsToObject = (permissions: string[]): Record<string, boolean> => {
  // Se tem super_admin ou todas as permissões, usar "all"
  if (permissions.includes('super_admin') || permissions.length === ALL_PERMISSIONS.length) {
    return { all: true };
  }
  const obj: Record<string, boolean> = {};
  permissions.forEach(p => obj[p] = true);
  return obj;
};

const ALL_PERMISSIONS = [
  'manage_tenants',
  'manage_admins',
  'manage_billing',
  'manage_settings',
  'view_analytics',
  'super_admin',
];

const PERMISSION_LABELS: Record<string, string> = {
  manage_tenants: 'Gerir Tenants',
  manage_admins: 'Gerir Admins',
  manage_billing: 'Gerir Facturação',
  manage_settings: 'Gerir Definições',
  view_analytics: 'Ver Analytics',
  super_admin: 'Super Admin',
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SuperAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    permissions: ['manage_tenants', 'view_analytics'] as string[],
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const token = Cookies.get('platform_token');
    try {
      const res = await fetch(`${API_URL}/platform/super-admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAdmins(await res.json());
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setForm({
      email: '',
      name: '',
      password: '',
      permissions: ['manage_tenants', 'view_analytics'],
    });
    setShowModal(true);
  };

  const openEditModal = (admin: SuperAdmin) => {
    setEditingAdmin(admin);
    setForm({
      email: admin.email,
      name: admin.name || '',
      password: '',
      permissions: permissionsToArray(admin.permissions),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const token = Cookies.get('platform_token');
    setSaving(true);

    try {
      const url = editingAdmin
        ? `${API_URL}/platform/super-admins/${editingAdmin.id}`
        : `${API_URL}/platform/super-admins`;

      const body: any = {
        email: form.email,
        name: form.name,
        permissions: permissionsToObject(form.permissions),
      };

      // Only include password if creating new or updating with new password
      if (!editingAdmin || form.password) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method: editingAdmin ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || 'Erro ao guardar admin');
        return;
      }

      setShowModal(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error saving admin:', error);
      alert('Erro ao guardar admin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: SuperAdmin) => {
    if (!confirm(`Tem certeza que deseja eliminar o admin "${admin.email}"?`)) {
      return;
    }

    const token = Cookies.get('platform_token');
    setDeleting(admin.id);

    try {
      const res = await fetch(`${API_URL}/platform/super-admins/${admin.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const error = await res.json();
        alert(error.detail || 'Erro ao eliminar admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Erro ao eliminar admin');
    } finally {
      setDeleting(null);
    }
  };

  const togglePermission = (permission: string) => {
    // Se clicar em "super_admin", dar/tirar todas as permissões
    if (permission === 'super_admin') {
      if (form.permissions.includes('super_admin')) {
        // Remover todas
        setForm({ ...form, permissions: [] });
      } else {
        // Dar todas
        setForm({ ...form, permissions: [...ALL_PERMISSIONS] });
      }
      return;
    }
    
    if (form.permissions.includes(permission)) {
      setForm({
        ...form,
        permissions: form.permissions.filter((p) => p !== permission && p !== 'super_admin'),
      });
    } else {
      const newPermissions = [...form.permissions, permission];
      // Se tem todas as outras permissões, adicionar super_admin também
      const hasAll = ALL_PERMISSIONS.filter(p => p !== 'super_admin').every(p => newPermissions.includes(p));
      if (hasAll) {
        newPermissions.push('super_admin');
      }
      setForm({
        ...form,
        permissions: newPermissions,
      });
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.name?.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Pesquisar admins..."
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
          Novo Admin
        </button>
      </div>

      {/* Admins List */}
      <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-background/50">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">
                Admin
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">
                Permissões
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">
                Último Login
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">
                Acções
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id} className="border-b border-border last:border-0">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {admin.name || admin.email}
                      </p>
                      <p className="text-sm text-text-muted">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {admin.permissions?.all === true || permissionsToArray(admin.permissions).includes('super_admin') ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                        Super Admin (Todas)
                      </span>
                    ) : (
                      <>
                        {permissionsToArray(admin.permissions).slice(0, 3).map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 bg-primary/20 text-primary rounded text-xs"
                          >
                            {PERMISSION_LABELS[perm] || perm}
                          </span>
                        ))}
                        {permissionsToArray(admin.permissions).length > 3 && (
                          <span className="px-2 py-1 bg-text-muted/20 text-text-muted rounded text-xs">
                            +{permissionsToArray(admin.permissions).length - 3}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        admin.is_active ? 'bg-success' : 'bg-danger'
                      }`}
                    />
                    <span className="text-sm text-text-muted">
                      {admin.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-text-muted">
                  {admin.last_login
                    ? new Date(admin.last_login).toLocaleDateString('pt-PT')
                    : 'Nunca'}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(admin)}
                      className="p-2 text-text-muted hover:text-white hover:bg-background rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin)}
                      disabled={deleting === admin.id}
                      className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === admin.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">Nenhum admin encontrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-white">
                {editingAdmin ? 'Editar Admin' : 'Novo Admin'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-text-muted hover:text-white hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!!editingAdmin}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary disabled:opacity-50"
                    placeholder="admin@exemplo.pt"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Nome
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                    placeholder="João Silva"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  {editingAdmin ? 'Nova Password (deixar em branco para manter)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Permissões
                </label>
                <div className="space-y-2">
                  {ALL_PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer hover:bg-background/80 transition-colors"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          form.permissions.includes(permission)
                            ? 'bg-primary border-primary'
                            : 'border-border'
                        }`}
                      >
                        {form.permissions.includes(permission) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-white">
                        {PERMISSION_LABELS[permission] || permission}
                      </span>
                    </label>
                  ))}
                </div>
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
                disabled={saving || !form.email || (!editingAdmin && !form.password)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-lg transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingAdmin ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
