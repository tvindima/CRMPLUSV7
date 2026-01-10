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
  max_users: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function TenantUsersPage() {
  const params = useParams();
  const tenantId = params.id;
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    const token = Cookies.get('platform_token');
    try {
      // Fetch tenant info
      const tenantRes = await fetch(`${API_URL}/platform/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setTenant(tenantData);
      }

      // Fetch users for this tenant
      const usersRes = await fetch(`${API_URL}/platform/tenants/${tenantId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'manager':
        return 'bg-blue-100 text-blue-700';
      case 'agent':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/tenants/${tenantId}`} className="text-blue-600 hover:underline">
          ← Voltar ao tenant
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Utilizadores: {tenant.name}</h1>
          <p className="text-gray-500">
            {users.length} de {tenant.max_users} utilizadores
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Utilizador
        </button>
      </div>

      {/* Usage Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Utilização de Licenças</span>
          <span className="font-medium">{users.length}/{tenant.max_users}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              users.length / tenant.max_users > 0.9 ? 'bg-red-500' : 
              users.length / tenant.max_users > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((users.length / tenant.max_users) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="mt-4 text-gray-500">Nenhum utilizador encontrado</p>
            <p className="text-sm text-gray-400">Os utilizadores serão listados aqui quando criados no backoffice do tenant</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-6 py-3">Utilizador</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Último Login</th>
                <th className="px-6 py-3">Criado em</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-PT') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
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
