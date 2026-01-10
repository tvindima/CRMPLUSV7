'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, ArrowLeft, Users, CreditCard, Globe, Settings, 
  CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw,
  Trash2, Power, PowerOff, Edit, Copy, Mail, Key, Calendar,
  BarChart3, Activity, Database, Server
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  primary_domain: string | null;
  backoffice_domain: string | null;
  custom_domain_verified: boolean;
  plan: string;
  is_active: boolean;
  is_trial: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  sector: string;
  status: 'pending' | 'provisioning' | 'ready' | 'failed';
  provisioning_error: string | null;
  provisioned_at: string | null;
  failed_at: string | null;
  schema_name: string | null;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  admin_email: string | null;
  admin_created: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  billing_email: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  max_agents: number;
  max_properties: number;
  features: Record<string, unknown>;
}

interface TenantStats {
  total_users: number;
  total_clients: number;
  total_transactions: number;
  storage_used_mb: number;
  active_sessions: number;
  last_activity: string | null;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');

  const tenantId = params.id as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchTenant = async () => {
    try {
      const response = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTenant(data);
        setAdminEmail(data.admin_email || '');
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/platform/tenants/${tenantId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (token && tenantId) {
      setLoading(true);
      Promise.all([fetchTenant(), fetchStats()])
        .finally(() => setLoading(false));
    }
  }, [token, tenantId]);

  const handleToggleActive = async () => {
    setActionLoading('toggle');
    try {
      const response = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !tenant?.is_active })
      });
      if (response.ok) {
        await fetchTenant();
      }
    } catch (error) {
      console.error('Error toggling tenant:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      const response = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        router.push('/tenants');
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleRetryProvisioning = async () => {
    setActionLoading('retry');
    try {
      const response = await fetch(`${API_URL}/platform/tenants/${tenantId}/retry-provisioning`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchTenant();
      }
    } catch (error) {
      console.error('Error retrying provisioning:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminPassword || !adminName) return;
    setActionLoading('admin');
    try {
      const response = await fetch(`${API_URL}/platform/tenants/${tenantId}/create-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          name: adminName
        })
      });
      if (response.ok) {
        await fetchTenant();
        setShowCreateAdmin(false);
        setAdminPassword('');
        setAdminName('');
      } else {
        const error = await response.json();
        alert(error.detail || 'Erro ao criar admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSectorLabel = (sector: string) => {
    const sectors: Record<string, string> = {
      'real_estate': 'Imobiliário',
      'automotive': 'Automóvel',
      'services': 'Serviços',
      'retail': 'Retalho',
      'hospitality': 'Hotelaria',
      'other': 'Outros'
    };
    return sectors[sector] || sector;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      ready: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/20', label: 'Pronto' },
      failed: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/20', label: 'Falhou' },
      pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/20', label: 'Pendente' },
      provisioning: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/20', label: 'A provisionar' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Tenant não encontrado</h2>
        <Link href="/tenants" className="text-primary hover:underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(tenant.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/tenants"
            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </Link>
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: tenant.primary_color + '30' }}
            >
              <Building2 className="w-6 h-6" style={{ color: tenant.primary_color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
              <div className="flex items-center gap-2 text-text-muted">
                <span>{tenant.slug}</span>
                <button onClick={() => copyToClipboard(tenant.slug)} className="hover:text-white">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>
          {tenant.is_trial && (
            <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm">
              Trial
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm ${
            tenant.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
          }`}>
            {tenant.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {tenant.status === 'failed' && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <div>
              <p className="font-medium text-danger">Provisionamento falhou</p>
              <p className="text-sm text-text-muted">{tenant.provisioning_error || 'Erro desconhecido'}</p>
            </div>
          </div>
          <button
            onClick={handleRetryProvisioning}
            disabled={actionLoading === 'retry'}
            className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading === 'retry' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Tentar Novamente
          </button>
        </div>
      )}

      {tenant.status === 'ready' && !tenant.admin_created && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium text-warning">Administrador não criado</p>
              <p className="text-sm text-text-muted">Este tenant ainda não tem um utilizador administrador</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="px-4 py-2 bg-warning text-black rounded-lg hover:bg-warning/90 flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            Criar Admin
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-background-secondary rounded-xl p-4 border border-border">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total_users}</p>
            <p className="text-sm text-text-muted">Utilizadores</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-4 border border-border">
            <Building2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total_clients}</p>
            <p className="text-sm text-text-muted">Clientes</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-4 border border-border">
            <CreditCard className="w-5 h-5 text-success mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total_transactions}</p>
            <p className="text-sm text-text-muted">Transações</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-4 border border-border">
            <Database className="w-5 h-5 text-secondary mb-2" />
            <p className="text-2xl font-bold text-white">{stats.storage_used_mb} MB</p>
            <p className="text-sm text-text-muted">Storage</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-4 border border-border">
            <Activity className="w-5 h-5 text-warning mb-2" />
            <p className="text-2xl font-bold text-white">{stats.active_sessions}</p>
            <p className="text-sm text-text-muted">Sessões Ativas</p>
          </div>
          <div className="bg-background-secondary rounded-xl p-4 border border-border">
            <Clock className="w-5 h-5 text-text-muted mb-2" />
            <p className="text-sm font-medium text-white">
              {stats.last_activity ? new Date(stats.last_activity).toLocaleDateString('pt-PT') : 'N/A'}
            </p>
            <p className="text-sm text-text-muted">Última Atividade</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-background-secondary rounded-xl border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-white">Informação Geral</h2>
              <Link
                href={`/tenants/${tenantId}/edit`}
                className="text-primary hover:underline text-sm flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Link>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-muted mb-1">Sector</p>
                <p className="text-white font-medium">{getSectorLabel(tenant.sector)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Plano</p>
                <p className="text-white font-medium capitalize">{tenant.plan}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Criado em</p>
                <p className="text-white">{new Date(tenant.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Última atualização</p>
                <p className="text-white">{new Date(tenant.updated_at).toLocaleDateString('pt-PT')}</p>
              </div>
              {tenant.is_trial && tenant.trial_ends_at && (
                <div className="col-span-2">
                  <p className="text-sm text-text-muted mb-1">Trial termina em</p>
                  <p className="text-warning font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(tenant.trial_ends_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Domains */}
          <div className="bg-background-secondary rounded-xl border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domínios
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Site/Montra */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">Site / Montra</p>
                  <p className="text-white font-medium">
                    {tenant.primary_domain || `${tenant.slug}.crmplus.trioto.tech`}
                  </p>
                  {tenant.primary_domain && (
                    <p className="text-xs text-text-muted mt-1">Domínio próprio configurado</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${tenant.primary_domain || `${tenant.slug}.crmplus.trioto.tech`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-background rounded-lg text-text-muted hover:text-white"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(tenant.primary_domain || `${tenant.slug}.crmplus.trioto.tech`)}
                    className="p-2 hover:bg-background rounded-lg"
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Backoffice */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted mb-1">Backoffice</p>
                  <p className="text-white font-medium">
                    {tenant.backoffice_domain || `${tenant.slug}.backoffice.crmplus.trioto.tech`}
                  </p>
                  {tenant.backoffice_domain && (
                    <p className="text-xs text-text-muted mt-1">Domínio próprio configurado</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${tenant.backoffice_domain || `${tenant.slug}.backoffice.crmplus.trioto.tech`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-background rounded-lg text-text-muted hover:text-white"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(tenant.backoffice_domain || `${tenant.slug}.backoffice.crmplus.trioto.tech`)}
                    className="p-2 hover:bg-background rounded-lg"
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* Schema Info */}
              {tenant.schema_name && (
                <div className="pt-3 mt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted mb-1">Schema PostgreSQL</p>
                      <p className="text-white font-mono text-sm">{tenant.schema_name}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(tenant.schema_name!)}
                      className="p-2 hover:bg-background rounded-lg"
                    >
                      <Copy className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin */}
          <div className="bg-background-secondary rounded-xl border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Administrador
              </h2>
            </div>
            <div className="p-6">
              {tenant.admin_created ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tenant.admin_email}</p>
                      <p className="text-sm text-text-muted">Administrador do tenant</p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted mb-3">Nenhum administrador criado</p>
                  <button
                    onClick={() => setShowCreateAdmin(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Criar Administrador
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-background-secondary rounded-xl border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-white">Ações Rápidas</h2>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={handleToggleActive}
                disabled={actionLoading === 'toggle'}
                className="w-full px-4 py-3 bg-background hover:bg-background/80 rounded-lg flex items-center gap-3 transition-colors disabled:opacity-50"
              >
                {tenant.is_active ? (
                  <>
                    <PowerOff className="w-5 h-5 text-warning" />
                    <span className="text-white">Desativar Tenant</span>
                  </>
                ) : (
                  <>
                    <Power className="w-5 h-5 text-success" />
                    <span className="text-white">Ativar Tenant</span>
                  </>
                )}
              </button>
              
              <Link
                href={`/tenants/${tenantId}/edit`}
                className="w-full px-4 py-3 bg-background hover:bg-background/80 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Edit className="w-5 h-5 text-blue-500" />
                <span className="text-white">Editar Configurações</span>
              </Link>

              <Link
                href={`/tenants/${tenantId}/users`}
                className="w-full px-4 py-3 bg-background hover:bg-background/80 rounded-lg flex items-center gap-3 transition-colors"
              >
                <Users className="w-5 h-5 text-primary" />
                <span className="text-white">Ver Utilizadores</span>
              </Link>

              <Link
                href={`/tenants/${tenantId}/billing`}
                className="w-full px-4 py-3 bg-background hover:bg-background/80 rounded-lg flex items-center gap-3 transition-colors"
              >
                <CreditCard className="w-5 h-5 text-success" />
                <span className="text-white">Faturação</span>
              </Link>

              <Link
                href={`/tenants/${tenantId}/logs`}
                className="w-full px-4 py-3 bg-background hover:bg-background/80 rounded-lg flex items-center gap-3 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-secondary" />
                <span className="text-white">Ver Logs</span>
              </Link>
            </div>
          </div>

          {/* Plan Info */}
          <div className="bg-background-secondary rounded-xl border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Server className="w-5 h-5" />
                Limites do Plano
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Agentes</span>
                  <span className="text-white">{stats?.total_users || 0} / {tenant.max_agents}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(((stats?.total_users || 0) / (tenant.max_agents || 10)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Imóveis</span>
                  <span className="text-white">{stats?.total_clients || 0} / {tenant.max_properties}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${Math.min(((stats?.total_clients || 0) / (tenant.max_properties || 100)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-danger/10 rounded-xl border border-danger/30">
            <div className="px-6 py-4 border-b border-danger/30">
              <h2 className="font-semibold text-danger">Zona de Perigo</h2>
            </div>
            <div className="p-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-3 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Eliminar Tenant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Eliminar Tenant</h3>
            <p className="text-text-muted mb-6">
              Tem a certeza que deseja eliminar <span className="text-white font-medium">{tenant.name}</span>? 
              Esta ação é irreversível e todos os dados serão perdidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-background border border-border text-white rounded-lg hover:bg-background/80"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="flex-1 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'delete' && <RefreshCw className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Criar Administrador</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Nome</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Nome do administrador"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="admin@empresa.pt"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateAdmin(false)}
                className="flex-1 px-4 py-2 bg-background border border-border text-white rounded-lg hover:bg-background/80"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAdmin}
                disabled={actionLoading === 'admin' || !adminEmail || !adminPassword || !adminName}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === 'admin' && <RefreshCw className="w-4 h-4 animate-spin" />}
                Criar Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
