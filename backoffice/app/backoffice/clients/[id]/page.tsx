'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ArrowLeftIcon, PencilIcon, TrashIcon, UserIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, BuildingOfficeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

type Client = {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  tipo_cliente?: string;
  client_type?: string;
  origin?: string;
  nif?: string;
  cc?: string;
  cc_validade?: string;
  data_nascimento?: string;
  naturalidade?: string;
  nacionalidade?: string;
  profissao?: string;
  entidade_empregadora?: string;
  estado_civil?: string;
  regime_casamento?: string;
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  pais?: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  agent_id?: number;
  agency_id?: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    
    const fetchClient = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/clients/${clientId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Cliente não encontrado');
          } else {
            setError('Erro ao carregar cliente');
          }
          return;
        }
        const data = await response.json();
        setClient(data);
      } catch (err) {
        console.error('Erro ao carregar cliente:', err);
        setError('Erro ao carregar cliente');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClient();
  }, [clientId]);

  const handleDelete = async () => {
    if (!client) return;
    if (!confirm(`Tem certeza que deseja eliminar o cliente "${client.nome}"?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/clients/${client.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/backoffice/clients');
      } else {
        alert('Erro ao eliminar cliente');
      }
    } catch (err) {
      console.error('Erro ao eliminar:', err);
      alert('Erro ao eliminar cliente');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-PT');
    } catch {
      return '—';
    }
  };

  const getTypeLabel = (type: string | undefined) => {
    const labels: Record<string, string> = {
      'comprador': 'Comprador',
      'vendedor': 'Vendedor',
      'arrendatario': 'Arrendatário',
      'senhorio': 'Senhorio',
      'lead': 'Lead',
    };
    return labels[type || ''] || type || 'Lead';
  };

  const getOriginLabel = (origin: string | undefined) => {
    const labels: Record<string, string> = {
      'website': 'Website',
      'referral': 'Referência',
      'social_media': 'Redes Sociais',
      'direct': 'Direto',
      'portal': 'Portal Imobiliário',
      'manual': 'Manual',
    };
    return labels[origin || ''] || origin || '—';
  };

  if (loading) {
    return (
      <BackofficeLayout title="Cliente">
        <div className="py-12 text-center text-[#999]">A carregar cliente...</div>
      </BackofficeLayout>
    );
  }

  if (error || !client) {
    return (
      <BackofficeLayout title="Cliente">
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">{error || 'Cliente não encontrado'}</p>
          <button
            onClick={() => router.push('/backoffice/clients')}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Voltar à lista
          </button>
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout title={`Cliente - ${client.nome}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/backoffice/clients')}
            className="rounded-lg border border-[#23232B] bg-[#0F0F12] p-2 text-[#999] transition-all hover:border-[#E10600]/30 hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">{client.nome}</h1>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E10600]/20 px-2 py-0.5 text-xs font-medium text-[#E10600]">
                {getTypeLabel(client.tipo_cliente || client.client_type)}
              </span>
              <span className="text-sm text-[#666]">•</span>
              <span className="text-sm text-[#999]">{getOriginLabel(client.origin)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/backoffice/clients/${client.id}/edit`)}
            className="flex items-center gap-2 rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2 text-sm text-white transition-all hover:border-[#E10600]/30"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-500 transition-all hover:bg-red-500/20 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            {deleting ? 'A eliminar...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Informações de Contacto */}
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <UserIcon className="h-5 w-5 text-[#E10600]" />
            Contacto
          </h2>
          <div className="space-y-4">
            {client.email && (
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-[#555]" />
                <div>
                  <p className="text-xs text-[#666]">Email</p>
                  <a href={`mailto:${client.email}`} className="text-sm text-white hover:text-[#E10600]">
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.telefone && (
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-5 w-5 text-[#555]" />
                <div>
                  <p className="text-xs text-[#666]">Telefone</p>
                  <a href={`tel:${client.telefone}`} className="text-sm text-white hover:text-[#E10600]">
                    {client.telefone}
                  </a>
                </div>
              </div>
            )}
            {(client.morada || client.localidade) && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="h-5 w-5 text-[#555]" />
                <div>
                  <p className="text-xs text-[#666]">Morada</p>
                  <p className="text-sm text-white">
                    {[client.morada, client.codigo_postal, client.localidade, client.pais].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <DocumentTextIcon className="h-5 w-5 text-[#E10600]" />
            Dados Pessoais
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#666]">NIF</p>
              <p className="text-sm text-white">{client.nif || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#666]">CC</p>
              <p className="text-sm text-white">{client.cc || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#666]">Data de Nascimento</p>
              <p className="text-sm text-white">{formatDate(client.data_nascimento)}</p>
            </div>
            <div>
              <p className="text-xs text-[#666]">Nacionalidade</p>
              <p className="text-sm text-white">{client.nacionalidade || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#666]">Estado Civil</p>
              <p className="text-sm text-white">{client.estado_civil || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-[#666]">Profissão</p>
              <p className="text-sm text-white">{client.profissao || '—'}</p>
            </div>
          </div>
        </div>

        {/* Informações Profissionais */}
        {client.entidade_empregadora && (
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
              <BuildingOfficeIcon className="h-5 w-5 text-[#E10600]" />
              Informações Profissionais
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#666]">Entidade Empregadora</p>
                <p className="text-sm text-white">{client.entidade_empregadora}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notas */}
        {client.notas && (
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
            <h2 className="mb-4 text-lg font-medium text-white">Notas</h2>
            <p className="whitespace-pre-wrap text-sm text-[#999]">{client.notas}</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-[#23232B] bg-[#0F0F12] px-6 py-4 text-xs text-[#666]">
        <div className="flex items-center gap-4">
          <span>ID: {client.id}</span>
          {client.agent_id && <span>Agente ID: {client.agent_id}</span>}
          {client.agency_id && <span>Agência ID: {client.agency_id}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Criado: {formatDate(client.created_at)}</span>
          {client.updated_at && <span>Atualizado: {formatDate(client.updated_at)}</span>}
        </div>
      </div>
    </BackofficeLayout>
  );
}
