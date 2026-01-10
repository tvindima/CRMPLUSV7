'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: string;
}

interface BillingInfo {
  plan: string;
  price: number;
  billing_cycle: string;
  next_billing_date: string;
  payment_method: string;
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  basic: 29,
  professional: 79,
  enterprise: 199,
};

export default function TenantBillingPage() {
  const params = useParams();
  const tenantId = params.id;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
    } finally {
      setLoading(false);
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

  const planPrice = PLAN_PRICES[tenant.plan] || 0;

  // Mock invoices for demo
  const mockInvoices: Invoice[] = [
    { id: 'INV-001', date: '2025-01-01', amount: planPrice, status: 'paid' },
    { id: 'INV-002', date: '2024-12-01', amount: planPrice, status: 'paid' },
    { id: 'INV-003', date: '2024-11-01', amount: planPrice, status: 'paid' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/tenants/${tenantId}`} className="text-blue-600 hover:underline">
          ← Voltar ao tenant
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Faturação: {tenant.name}</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Plano Atual</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold capitalize">{tenant.plan}</p>
            <p className="text-gray-500">
              €{planPrice}/mês
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Alterar Plano
          </button>
        </div>
      </div>

      {/* Billing Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informação de Faturação</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Ciclo de Faturação</p>
            <p className="font-medium">Mensal</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Próxima Fatura</p>
            <p className="font-medium">1 de Fevereiro, 2025</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Método de Pagamento</p>
            <p className="font-medium">•••• •••• •••• 4242</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email de Faturação</p>
            <p className="font-medium">admin@{tenant.slug}.com</p>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico de Faturas</h2>
        
        {planPrice === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Plano gratuito - sem faturas
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3">Fatura</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{invoice.id}</td>
                  <td className="py-3 text-gray-600">{invoice.date}</td>
                  <td className="py-3">€{invoice.amount}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status === 'paid' ? 'Pago' : invoice.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-blue-600 hover:underline text-sm">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
