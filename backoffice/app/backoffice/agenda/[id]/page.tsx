'use client';

import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";

type Props = { params: { id: string } };

const mockVisit = {
  referencia: "MB1026",
  lead: "JR1044",
  agente: "Pedro Olaio",
  data: "26/04/2024 10:00",
  estado: "Confirmada",
  notas: "Visita confirmada com cliente; verificar chaves no local.",
};

export default function VisitaDetalhePage({ params }: Props) {
  return (
    <ToastProvider>
      <BackofficeLayout title={`Visita ${params.id}`}>
        <div className="space-y-4 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-5 text-white">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{mockVisit.referencia}</p>
              <p className="text-sm text-[#C5C5C5]">Lead {mockVisit.lead}</p>
            </div>
            <p className="text-xs text-[#C5C5C5]">{mockVisit.estado}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Data" value={mockVisit.data} />
            <Info label="Agente" value={mockVisit.agente} />
            <Info label="Estado" value={mockVisit.estado} />
          </div>
          <div>
            <p className="text-sm text-[#C5C5C5]">Notas</p>
            <p className="text-sm text-white">{mockVisit.notas}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-[#C5C5C5]">
            <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Reagendar</button>
            <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Concluir</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#C5C5C5]">TODO: ligar aos endpoints reais de visitas e ações (reagendar/concluir).</p>
      </BackofficeLayout>
    </ToastProvider>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-[#1F1F22] bg-[#0B0B0D] px-3 py-2 text-sm text-white">
      <p className="text-xs uppercase tracking-wide text-[#C5C5C5]">{label}</p>
      <p>{value || "—"}</p>
    </div>
  );
}
