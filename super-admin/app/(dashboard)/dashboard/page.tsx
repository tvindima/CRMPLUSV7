'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import {
  Building2,
  Users,
  Home,
  FileText,
  TrendingUp,
  Activity,
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
}

interface Tenant {
  id: number;
  slug: string;
  name: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export default function DashboardPage() {
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
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-white">Tenants Recentes</h3>
        </div>
        <div className="divide-y divide-border">
          {tenants.slice(0, 5).map((tenant) => (
            <div
              key={tenant.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-background/50 transition-colors"
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tenant.plan === 'enterprise' ? 'bg-primary/20 text-primary' :
                  tenant.plan === 'pro' ? 'bg-secondary/20 text-secondary' :
                  'bg-text-muted/20 text-text-muted'
                }`}>
                  {tenant.plan}
                </span>
                <span className={`w-2 h-2 rounded-full ${tenant.is_active ? 'bg-success' : 'bg-danger'}`} />
              </div>
            </div>
          ))}
          {tenants.length === 0 && (
            <div className="px-6 py-8 text-center text-text-muted">
              Nenhum tenant registado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
