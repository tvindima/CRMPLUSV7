'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import { DataTable } from "../../../backoffice/components/DataTable";

type LeadItem = {
  id: number;
  title: string;
  prioridade: string;
  criado: string;
  fonte: string;
  angariador: string;
  estado: string;
  telefone?: string;
};

const mockLeads: LeadItem[] = [
  { id: 1, title: "JR1044", prioridade: "Alta", criado: "26/04/2024", fonte: "Portal", angariador: "Pedro Olaio", estado: "Em contacto" },
  { id: 2, title: "MB1018", prioridade: "Média", criado: "25/04/2024", fonte: "Website", angariador: "Nuno Faria", estado: "Nova" },
  { id: 3, title: "MB1026", prioridade: "Baixa", criado: "23/04/2024", fonte: "Ref. interna", angariador: "João Silva", estado: "Visita marcada" },
];

export default function LeadsPage() {
  return (
    <ToastProvider>
      <LeadsInner />
    </ToastProvider>
  );
}

function LeadsInner() {
  const [status, setStatus] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockLeads.filter((l) => {
      const matchesStatus = status === "Todos" || l.estado === status;
      const matchesSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.angariador.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [status, search]);

  return (
    <BackofficeLayout title="Leads">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar"
          className="w-full max-w-xs rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option>Todos</option>
          <option>Nova</option>
          <option>Em contacto</option>
          <option>Visita marcada</option>
        </select>
      </div>

      <DataTable
        dense
        columns={["Lead", "Prioridade", "Criado", "Fonte", "Angariador", "Estado", "Ações"]}
        rows={filtered.map((l) => [
          l.title,
          l.prioridade,
          l.criado,
          l.fonte,
          l.angariador,
          l.estado,
          <Link key={`edit-${l.id}`} href={`/backoffice/leads/${l.id}`} className="text-[#E10600] underline">
            Ver/Editar
          </Link>,
        ])}
      />

      <p className="mt-2 text-xs text-[#C5C5C5]">
        TODO: ligar à API real de leads (CRUD, filtros, estados) e substituir dados mock quando o backend expuser endpoints.
      </p>
    </BackofficeLayout>
  );
}
