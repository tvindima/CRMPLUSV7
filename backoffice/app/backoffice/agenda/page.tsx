'use client';

import { useEffect, useMemo, useState } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import { DataTable } from "../../../backoffice/components/DataTable";
import { CalendarIcon } from "@heroicons/react/24/outline";

type VisitItem = {
  id: number;
  data: string;
  lead: string;
  agente: string;
  estado: string;
  referencia: string;
};

export default function AgendaPage() {
  return (
    <ToastProvider>
      <AgendaInner />
    </ToastProvider>
  );
}

function AgendaInner() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todas");

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      // TODO: Implementar quando endpoint /api/visits estiver disponível
      // const response = await fetch('/api/visits');
      // const data = await response.json();
      // setVisits(data);
      setVisits([]);
    } catch (error) {
      console.error("Erro ao carregar visitas:", error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === "Todas") return visits;
    return visits.filter((v) => v.estado === filter);
  }, [filter, visits]);

  return (
    <BackofficeLayout title="Agenda">
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option>Todas</option>
          <option>Confirmada</option>
          <option>Pendente</option>
          <option>Realizada</option>
          <option>Cancelada</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar agenda...</div>
      ) : visits.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhuma visita agendada</p>
          <p className="mt-2 text-xs text-[#666]">
            As visitas agendadas aparecerão aqui quando forem criadas
          </p>
        </div>
      ) : (
        <DataTable
          dense
          columns={["Data", "Lead", "Agente", "Estado", "Referência", "Ações"]}
          rows={filtered.map((v) => [
            v.data,
            v.lead,
            v.agente,
            v.estado,
            v.referencia,
            "Editar",
          ])}
        />
      )}
    </BackofficeLayout>
  );
}
