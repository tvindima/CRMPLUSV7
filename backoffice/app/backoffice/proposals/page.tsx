'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

type Proposal = {
  id: number;
  opportunity_id: number;
  valor_proposta: number;
  tipo_proposta: string;
  status: string;
  data_validade?: string;
  created_at: string;
  opportunity?: {
    titulo: string;
    client?: { nome: string };
    property?: { titulo: string };
  };
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aceite: 'Aceite',
  rejeitada: 'Rejeitada',
  contra_proposta: 'Contra-proposta',
  expirada: 'Expirada',
};

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-400',
  aceite: 'bg-green-500/20 text-green-400',
  rejeitada: 'bg-red-500/20 text-red-400',
  contra_proposta: 'bg-orange-500/20 text-orange-400',
  expirada: 'bg-gray-500/20 text-gray-400',
};

const tipoLabels: Record<string, string> = {
  compra: 'Compra',
  arrendamento: 'Arrendamento',
  permuta: 'Permuta',
};

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals?limit=100', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProposals(data.items || []);
        }
      } catch (error) {
        console.error('Erro ao carregar propostas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposals();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-PT');
  };

  return (
    <BackofficeLayout title="Propostas">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Propostas</h1>
          <p className="text-sm text-[#999]">Gerir propostas de compra/arrendamento</p>
        </div>
        <button
          onClick={() => router.push("/backoffice/proposals/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Nova Proposta
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar propostas...</div>
      ) : proposals.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhuma proposta encontrada</p>
          <button
            onClick={() => router.push("/backoffice/proposals/new")}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Criar primeira proposta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              onClick={() => router.push(`/backoffice/proposals/${proposal.id}`)}
              className="cursor-pointer rounded-xl border border-[#23232B] bg-[#0F0F12] p-4 transition-all hover:border-[#E10600]/30 hover:bg-[#151518]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {proposal.opportunity?.titulo || `Proposta #${proposal.id}`}
                  </h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-[#999]">
                    {proposal.opportunity?.client?.nome && (
                      <span>Cliente: {proposal.opportunity.client.nome}</span>
                    )}
                    {proposal.opportunity?.property?.titulo && (
                      <span>Imóvel: {proposal.opportunity.property.titulo}</span>
                    )}
                    <span>Válida até: {formatDate(proposal.data_validade)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatCurrency(proposal.valor_proposta)}</p>
                    <p className="text-xs text-[#999]">{tipoLabels[proposal.tipo_proposta] || proposal.tipo_proposta}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[proposal.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {statusLabels[proposal.status] || proposal.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </BackofficeLayout>
  );
}
