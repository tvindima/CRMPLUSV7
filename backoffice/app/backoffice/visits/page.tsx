'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";

type Visit = {
  id: number;
  scheduled_date: string;
  status: string;
  notes?: string;
  property?: { titulo: string; referencia?: string };
  lead?: { nome: string };
  agent?: { nome: string };
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'Não Compareceu',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400',
  confirmed: 'bg-green-500/20 text-green-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show: 'bg-orange-500/20 text-orange-400',
};

export default function VisitsPage() {
  const router = useRouter();
  const { sector } = useTenant();
  const { term } = useTerminology();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  // Terminologia dinâmica para visitas
  const visitsLabel = term('visits', 'Visitas');
  const visitLabel = term('visit_singular', 'Visita');
  const itemLabel = term('item_plural', 'itens');

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch('/api/visits?per_page=100', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visits || []);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${visitsLabel.toLowerCase()}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVisits();
  }, [visitsLabel]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <BackofficeLayout title={visitsLabel}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{visitsLabel}</h1>
          <p className="text-sm text-[#999]">Gerir {visitsLabel.toLowerCase()} a {itemLabel}</p>
        </div>
        <button
          onClick={() => router.push("/backoffice/visits/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Agendar {visitLabel}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar {visitsLabel.toLowerCase()}...</div>
      ) : visits.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhum {visitLabel.toLowerCase()} agendado</p>
          <button
            onClick={() => router.push("/backoffice/visits/new")}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Agendar primeiro {visitLabel.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <div
              key={visit.id}
              onClick={() => router.push(`/backoffice/visits/${visit.id}`)}
              className="cursor-pointer rounded-xl border border-[#23232B] bg-[#0F0F12] p-4 transition-all hover:border-[#E10600]/30 hover:bg-[#151518]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {visit.property?.titulo || `${visitLabel} #${visit.id}`}
                  </h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-[#999]">
                    <span>{formatDateTime(visit.scheduled_date)}</span>
                    {visit.lead?.nome && (
                      <span>Cliente: {visit.lead.nome}</span>
                    )}
                    {visit.property?.referencia && (
                      <span>Ref: {visit.property.referencia}</span>
                    )}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[visit.status] || 'bg-gray-500/20 text-gray-400'}`}>
                  {statusLabels[visit.status] || visit.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BackofficeLayout>
  );
}
