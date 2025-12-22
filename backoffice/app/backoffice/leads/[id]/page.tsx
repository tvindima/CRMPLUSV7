'use client';

import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";

type Props = { params: { id: string } };

const mockLead = {
  title: "JR1044",
  nome: "Pedro Olaio",
  email: "polaio@imoveismais.pt",
  telefone: "915213221",
  prioridade: "Alta",
  estado: "Em contacto",
  origem: "Portal",
  notas: "Cliente pediu visita para próxima semana.",
  historico: [
    { ts: "há 3 min", texto: "Editou lead" },
    { ts: "Ontem 14:02", texto: "Nova lead atribuída" },
  ],
};

export default function LeadDetalhePage({ params }: Props) {
  return (
    <ToastProvider>
      <BackofficeLayout title={`Lead ${params.id}`}>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{mockLead.title}</p>
                  <p className="text-sm text-[#C5C5C5]">{mockLead.nome}</p>
                </div>
                <div className="text-xs text-[#C5C5C5]">{mockLead.estado}</div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Info label="Email" value={mockLead.email} />
                <Info label="Telefone" value={mockLead.telefone} />
                <Info label="Prioridade" value={mockLead.prioridade} />
                <Info label="Origem" value={mockLead.origem} />
              </div>
              <div className="mt-4">
                <p className="text-sm text-[#C5C5C5]">Notas</p>
                <p className="text-sm text-white">{mockLead.notas}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-5 text-white">
              <p className="text-lg font-semibold">Histórico</p>
              <div className="mt-3 space-y-2">
                {mockLead.historico.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-[#1F1F22] px-3 py-2 text-sm">
                    <span>{h.texto}</span>
                    <span className="text-xs text-[#C5C5C5]">{h.ts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
              <p className="text-lg font-semibold">Ações</p>
              <div className="mt-3 space-y-2 text-sm text-[#C5C5C5]">
                <button className="w-full rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Marcar visita</button>
                <button className="w-full rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Reatribuir</button>
                <button className="w-full rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Alterar estado</button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-[#C5C5C5]">TODO: ligar a dados reais de leads e ações (marcar visita, alterar estado) quando API estiver disponível.</p>
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
