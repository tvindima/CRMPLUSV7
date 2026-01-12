'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import { DataTable } from "../../../backoffice/components/DataTable";
import { CalendarIcon, PlusIcon } from "@heroicons/react/24/outline";
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

const statusMap: Record<string, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'Não Compareceu',
};

export default function AgendaPage() {
  return (
    <ToastProvider>
      <AgendaInner />
    </ToastProvider>
  );
}

function AgendaInner() {
  const router = useRouter();
  const { term } = useTerminology();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todas");

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      const response = await fetch('/api/visits?per_page=100', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setVisits(data.visits || []);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${term('visits', 'agendamentos').toLowerCase()}:`, error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filtered = useMemo(() => {
    if (filter === "Todas") return visits;
    const statusKey = Object.entries(statusMap).find(([_, v]) => v === filter)?.[0];
    return visits.filter((v) => v.status === statusKey);
  }, [filter, visits]);

  const tableRows = filtered.map((v) => [
    formatDateTime(v.scheduled_date),
    v.lead?.nome || '-',
    v.agent?.nome || '-',
    statusMap[v.status] || v.status,
    v.property?.referencia || '-',
    <button
      key={v.id}
      onClick={() => router.push(`/backoffice/agenda/${v.id}`)}
      className="text-sm text-[#E10600] hover:underline"
    >
      Ver
    </button>,
  ]);

  return (
    <BackofficeLayout title="Agenda">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option>Todas</option>
          <option>Confirmada</option>
          <option>Agendada</option>
          <option>Realizada</option>
          <option>Cancelada</option>
        </select>
        <button
          onClick={() => router.push("/backoffice/visits/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Agendar {term('visit_singular', 'Visita')}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar agenda...</div>
      ) : visits.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhum {term('visit_singular', 'agendamento').toLowerCase()} marcado</p>
          <p className="mt-2 text-xs text-[#666]">
            Os {term('visits', 'agendamentos').toLowerCase()} aparecerão aqui quando forem criados
          </p>
        </div>
      ) : (
        <DataTable
          dense
          columns={["Data", "Lead", term('agent', 'Comercial'), "Estado", "Referência", "Ações"]}
          rows={tableRows}
        />
      )}
    </BackofficeLayout>
  );
}
