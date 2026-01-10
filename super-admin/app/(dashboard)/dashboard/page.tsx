'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
  Building2,
  Users,
  Home,
  FileText,
  TrendingUp,
  Activity,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface Dashboard {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  total_agents: number;
  total_properties: number;
  total_leads: number;
  tenants_by_plan: Record<string, number>;
  tenants_by_sector?: Record<string, number>;
}

interface Tenant {
  id: number;
  slug: string;
  name: string;
  plan: string;
  sector?: string;
  status: string;
  is_active: boolean;
  is_trial: boolean;
  trial_ends_at?: string;
  created_at: string;
  admin_email?: string;
  admin_created: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = Cookies.get('platform_token');

    try {
      const [dashboardRes, tenantsRes] = await Promise.all([
        fetch(`${API_URL}/platform/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/platform/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dashboardRes.ok) {
        setDashboard(await dashboardRes.json());
      }
      if (tenantsRes.ok) {
        setTenants(await tenantsRes.json());
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Tenants',
      value: dashboard?.total_tenants || 0,
      icon: Building2,
      color: 'bg-primary/20 text-primary',
    },
    {
      label: 'Tenants Activos',
      value: dashboard?.active_tenants || 0,
      icon: Activity,
      color: 'bg-success/20 text-success',
    },
    {
      label: 'Total Agentes',
      value: dashboard?.total_agents || 0,
      icon: Users,
      color: 'bg-secondary/20 text-secondary',
    },
    {
      label: 'Total Propriedades',
      value: dashboard?.total_properties || 0,
      icon: Home,
      color: 'bg-warning/20 text-warning',
    },
    {
      label: 'Total Leads',
      value: dashboard?.total_leads || 0,
      icon: FileText,
      color: 'bg-danger/20 text-danger',
    },
    {
      label: 'Em Trial',
      value: dashboard?.trial_tenants || 0,
      icon: TrendingUp,
      color: 'bg-blue-500/20 text-blue-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/tenants/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Tenant
        </Link>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-border text-white rounded-lg hover:bg-background transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Atualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background-secondary rounded-xl p-4 border border-border"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {tenants.some(t => t.status === 'failed' || t.status === 'pending' || !t.admin_created) && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-warning">Ações Pendentes</h3>
          </div>
          <div className="space-y-2">
            {tenants.filter(t => t.status === 'failed').map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-white">
                  <XCircle className="w-4 h-4 inline mr-2 text-danger" />
                  {t.name} - Provisionamento falhou
                </span>
                <Link href={`/tenants/${t.id}`} className="text-primary hover:underline">
                  Resolver
                </Link>
              </div>
            ))}
            {tenants.filter(t => t.status === 'pending').map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-white">
                  <Clock className="w-4 h-4 inline mr-2 text-warning" />
                  {t.name} - Aguarda provisionamento
                </span>
                <Link href={`/tenants/${t.id}`} className="text-primary hover:underline">
                  Ver
                </Link>
              </div>
            ))}
            {tenants.filter(t => t.status === 'ready' && !t.admin_created).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-white">
                  <Users className="w-4 h-4 inline mr-2 text-blue-500" />
                  {t.name} - Sem admin criado
                </span>
                <Link href={`/tenants/${t.id}`} className="text-primary hover:underline">
                  Criar Admin
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenants by Plan */}
      {dashboard?.tenants_by_plan && Object.keys(dashboard.tenants_by_plan).length > 0 && (
        <div className="bg-background-secondary rounded-xl p-6 border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Plano</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(dashboard.tenants_by_plan).map(([plan, count]) => (
              <div
                key={plan}
                className="flex items-center gap-3 px-4 py-2 bg-background rounded-lg"
              >
                <span className={`w-3 h-3 rounded-full ${
                  plan === 'enterprise' ? 'bg-primary' :
                  plan === 'pro' ? 'bg-secondary' : 'bg-text-muted'
                }`} />
                <span className="text-white font-medium capitalize">{plan}</span>
                <span className="text-text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tenants */}
      <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Tenants Recentes</h3>
          <Link href="/tenants" className="text-primary hover:underline text-sm flex items-center gap-1">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {tenants.slice(0, 5).map((tenant) => (
            <Link
              key={tenant.id}
              href={`/tenants/${tenant.id}`}
              className="px-6 py-4 flex items-center justify-between hover:bg-background/50 transition-colors block"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-white">{tenant.name}</p>
                  <p className="text-sm text-text-muted">{tenant.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Status badge */}
                {tenant.status === 'ready' ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : tenant.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-danger" />
                ) : (
                  <Clock className="w-4 h-4 text-warning" />
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                <span className={`w-2 h-2 rounded-full ${tenant.is_active ? 'bg-success' : 'bg-danger'}`} />
              </div>
            </Link>
          ))}
          {tenants.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Building2 className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted mb-4">Nenhum tenant registado</p>
              <Link
                href="/tenants/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Primeiro Tenant
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
