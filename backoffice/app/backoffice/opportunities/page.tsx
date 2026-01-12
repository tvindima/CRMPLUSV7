'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, BoltIcon } from "@heroicons/react/24/outline";

type Opportunity = {
  id: number;
  titulo: string;
  client_id?: number;
  property_id?: number;
  status: string;
  valor_estimado?: number;
  probabilidade?: number;
  created_at: string;
  client?: { nome: string };
  property?: { titulo: string };
};

const statusLabels: Record<string, string> = {
  novo: 'Novo',
  contacto: 'Contacto',
  visita_agendada: 'Visita Agendada',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado_ganho: 'Fechado (Ganho)',
  fechado_perdido: 'Fechado (Perdido)',
};

const statusColors: Record<string, string> = {
  novo: 'bg-blue-500/20 text-blue-400',
  contacto: 'bg-yellow-500/20 text-yellow-400',
  visita_agendada: 'bg-purple-500/20 text-purple-400',
  proposta: 'bg-orange-500/20 text-orange-400',
  negociacao: 'bg-cyan-500/20 text-cyan-400',
  fechado_ganho: 'bg-green-500/20 text-green-400',
  fechado_perdido: 'bg-red-500/20 text-red-400',
};

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/opportunities?limit=100', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setOpportunities(data.items || []);
        }
      } catch (error) {
        console.error('Erro ao carregar oportunidades:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpportunities();
  }, []);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <BackofficeLayout title="Oportunidades">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Oportunidades</h1>
          <p className="text-sm text-[#999]">Gerir oportunidades de negócio</p>
        </div>
        <button
          onClick={() => router.push("/backoffice/opportunities/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Nova Oportunidade
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar oportunidades...</div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <BoltIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhuma oportunidade encontrada</p>
          <button
            onClick={() => router.push("/backoffice/opportunities/new")}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Criar primeira oportunidade
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              onClick={() => router.push(`/backoffice/opportunities/${opportunity.id}`)}
              className="cursor-pointer rounded-xl border border-[#23232B] bg-[#0F0F12] p-4 transition-all hover:border-[#E10600]/30 hover:bg-[#151518]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white">{opportunity.titulo}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-[#999]">
                    {opportunity.client?.nome && (
                      <span>Cliente: {opportunity.client.nome}</span>
                    )}
                    {opportunity.property?.titulo && (
                      <span>Imóvel: {opportunity.property.titulo}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatCurrency(opportunity.valor_estimado)}</p>
                    {opportunity.probabilidade && (
                      <p className="text-xs text-[#999]">{opportunity.probabilidade}% probabilidade</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[opportunity.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {statusLabels[opportunity.status] || opportunity.status}
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
