'use client';

import { useMemo, useState } from "react";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import { DataTable } from "../../../backoffice/components/DataTable";

type VisitItem = {
  id: number;
  data: string;
  lead: string;
  agente: string;
  estado: string;
  referencia: string;
};

const mockVisits: VisitItem[] = [
  { id: 1, data: "26/04/2024 10:00", lead: "JR1044", agente: "Pedro Olaio", estado: "Confirmada", referencia: "MB1026" },
  { id: 2, data: "27/04/2024 15:00", lead: "MB1018", agente: "Nuno Faria", estado: "Pendente", referencia: "MB1018" },
];

export default function AgendaPage() {
  return (
    <ToastProvider>
      <AgendaInner />
    </ToastProvider>
  );
}

function AgendaInner() {
  const [filter, setFilter] = useState("Todas");

  const filtered = useMemo(() => {
    if (filter === "Todas") return mockVisits;
    return mockVisits.filter((v) => v.estado === filter);
  }, [filter]);

  return (
    <BackofficeLayout title="Visitas">
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option>Todas</option>
          <option>Confirmada</option>
          <option>Pendente</option>
        </select>
      </div>
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
      <p className="mt-2 text-xs text-[#C5C5C5]">TODO: substituir mocks por dados reais de visitas quando endpoints estiverem disponíveis.</p>
    </BackofficeLayout>
  );
}
