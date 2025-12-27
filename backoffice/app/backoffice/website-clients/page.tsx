'use client';

import { useEffect, useState } from "react";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  UserIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

interface WebsiteClient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  client_type?: string;
  interest_type?: string;
  assigned_agent_id?: number;
  assigned_agent_name?: string;
  agent_selected_by_client?: boolean;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

interface Stats {
  total: number;
  by_client_type: Record<string, number>;
  by_interest_type: Record<string, number>;
  by_agent: Array<{ agent_id: number; agent_name: string; count: number }>;
  round_robin_counters: Array<{ type: string; last_index: number }>;
}

type FilterType = 'all' | 'investidor' | 'pontual' | 'arrendamento';
type InterestFilter = 'all' | 'compra' | 'arrendamento';

export default function WebsiteClientsPage() {
  const [clients, setClients] = useState<WebsiteClient[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterInterest, setFilterInterest] = useState<InterestFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/website/clients/?limit=100`;
      
      if (filterType !== 'all') {
        url += `&client_type=${filterType}`;
      }
      if (filterInterest !== 'all') {
        url += `&interest_type=${filterInterest}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/website/clients/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, [filterType, filterInterest]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search !== "") {
        fetchClients();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const getClientTypeLabel = (type?: string) => {
    switch (type) {
      case 'investidor': return 'Investidor';
      case 'pontual': return 'Pontual';
      case 'arrendamento': return 'Arrendamento';
      default: return 'N/D';
    }
  };

  const getClientTypeColor = (type?: string) => {
    switch (type) {
      case 'investidor': return 'bg-yellow-500/20 text-yellow-400';
      case 'pontual': return 'bg-blue-500/20 text-blue-400';
      case 'arrendamento': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getInterestTypeIcon = (type?: string) => {
    if (type === 'arrendamento') {
      return <BuildingOfficeIcon className="h-4 w-4" />;
    }
    return <HomeIcon className="h-4 w-4" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <BackofficeLayout title="Clientes Registados">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Clientes do Website</h1>
            <p className="text-sm text-[#999]">
              Utilizadores registados no site público
            </p>
          </div>
          <button
            onClick={() => { fetchClients(); fetchStats(); }}
            className="flex items-center gap-2 rounded-lg bg-[#23232B] px-4 py-2 text-sm text-white transition hover:bg-[#2A2A35]"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E10600]/20">
                  <UserGroupIcon className="h-5 w-5 text-[#E10600]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-[#999]">Total de Clientes</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                  <span className="text-lg">💼</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.by_client_type['investidor'] || 0}
                  </p>
                  <p className="text-xs text-[#999]">Investidores</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                  <span className="text-lg">🏠</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.by_client_type['pontual'] || 0}
                  </p>
                  <p className="text-xs text-[#999]">Clientes Pontuais</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                  <span className="text-lg">🔑</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.by_interest_type['arrendamento'] || 0}
                  </p>
                  <p className="text-xs text-[#999]">Arrendamento</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Por Agente */}
        {stats && stats.by_agent.length > 0 && (
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Distribuição por Agente</h3>
            <div className="flex flex-wrap gap-3">
              {stats.by_agent.map((item) => (
                <div 
                  key={item.agent_id}
                  className="flex items-center gap-2 rounded-lg bg-[#1A1A1E] px-3 py-2"
                >
                  <UserIcon className="h-4 w-4 text-[#E10600]" />
                  <span className="text-sm text-white">{item.agent_name}</span>
                  <span className="rounded-full bg-[#E10600] px-2 py-0.5 text-xs font-bold text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#23232B] bg-[#0F0F12] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#666] outline-none focus:border-[#E10600]"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${
              showFilters || filterType !== 'all' || filterInterest !== 'all'
                ? 'border-[#E10600] bg-[#E10600]/10 text-[#E10600]'
                : 'border-[#23232B] bg-[#0F0F12] text-white'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
            <ChevronDownIcon className={`h-4 w-4 transition ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
            <div>
              <label className="mb-1 block text-xs text-[#999]">Tipo de Cliente</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="rounded-lg border border-[#23232B] bg-[#1A1A1E] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="all">Todos</option>
                <option value="investidor">Investidor</option>
                <option value="pontual">Pontual</option>
                <option value="arrendamento">Arrendamento</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-[#999]">Interesse</label>
              <select
                value={filterInterest}
                onChange={(e) => setFilterInterest(e.target.value as InterestFilter)}
                className="rounded-lg border border-[#23232B] bg-[#1A1A1E] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="all">Todos</option>
                <option value="compra">Compra</option>
                <option value="arrendamento">Arrendamento</option>
              </select>
            </div>

            {(filterType !== 'all' || filterInterest !== 'all') && (
              <button
                onClick={() => { setFilterType('all'); setFilterInterest('all'); }}
                className="self-end rounded-lg bg-[#E10600]/20 px-3 py-2 text-sm text-[#E10600] transition hover:bg-[#E10600]/30"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Clients List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#E10600] border-t-transparent"></div>
            <p className="mt-3 text-[#999]">A carregar clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-[#555]" />
            <p className="mt-4 text-[#999]">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#23232B]">
            <table className="w-full">
              <thead className="border-b border-[#23232B] bg-[#0F0F12]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Interesse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Agente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Registo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#999]">
                    Último Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23232B] bg-[#0B0B0D]">
                {clients.map((client) => (
                  <tr key={client.id} className="transition hover:bg-[#0F0F12]">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-xs text-[#999]">{client.email}</p>
                        {client.phone && (
                          <p className="text-xs text-[#666]">{client.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getClientTypeColor(client.client_type)}`}>
                        {getClientTypeLabel(client.client_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#999]">
                        {getInterestTypeIcon(client.interest_type)}
                        {client.interest_type === 'arrendamento' ? 'Arrendamento' : 'Compra'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {client.assigned_agent_name ? (
                        <div>
                          <p className="text-sm text-white">{client.assigned_agent_name}</p>
                          {client.agent_selected_by_client && (
                            <p className="text-xs text-green-400">✓ Escolhido pelo cliente</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-[#666]">Não atribuído</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#999]">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#999]">
                      {formatDate(client.last_login)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
}
