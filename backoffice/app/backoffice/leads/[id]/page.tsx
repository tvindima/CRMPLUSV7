'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";
import { UserIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getBackofficeLead, BackofficeLead } from "@/src/services/backofficeApi";

type Props = { params: { id: string } };

export default function LeadDetalhePage({ params }: Props) {
  const router = useRouter();
  const [lead, setLead] = useState<BackofficeLead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLead() {
      try {
        const data = await getBackofficeLead(parseInt(params.id));
        setLead(data);
      } catch (err) {
        console.error("Erro ao carregar lead:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLead();
  }, [params.id]);

  const statusLabels: Record<string, string> = {
    new: "Nova",
    contacted: "Contactada",
    qualified: "Qualificada",
    proposal_sent: "Proposta Enviada",
    visit_scheduled: "Visita Agendada",
    negotiation: "Em Negociação",
    converted: "Convertida",
    lost: "Perdida",
  };

  return (
    <ToastProvider>
      <BackofficeLayout title={`Lead ${params.id}`}>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-[#999] hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </button>

        {loading ? (
          <div className="py-12 text-center text-[#999]">A carregar...</div>
        ) : lead ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Lead #{lead.id}</p>
                    <p className="text-sm text-[#C5C5C5]">{lead.name}</p>
                  </div>
                  <span className="rounded-full bg-[#1F1F22] px-3 py-1 text-xs">
                    {statusLabels[lead.status] || lead.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Info label="Email" value={lead.email} />
                  <Info label="Telefone" value={lead.phone} />
                  <Info label="Origem" value={lead.origin || lead.source} />
                  <Info label="Ação" value={lead.action_type} />
                </div>
                {lead.message && (
                  <div className="mt-4">
                    <p className="text-sm text-[#C5C5C5]">Mensagem</p>
                    <p className="text-sm text-white">{lead.message}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
                <p className="text-lg font-semibold">Ações</p>
                <div className="mt-3 space-y-2 text-sm">
                  <button className="w-full rounded-lg bg-[#E10600] px-3 py-2 text-white hover:bg-[#c00500]">Marcar visita</button>
                  <button className="w-full rounded-lg border border-[#2A2A2E] bg-[#101013] px-3 py-2 text-white hover:border-[#E10600]">Reatribuir</button>
                  <button className="w-full rounded-lg border border-[#2A2A2E] bg-[#101013] px-3 py-2 text-white hover:border-[#E10600]">Alterar estado</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-[#555]" />
            <p className="mt-4 text-[#999]">Lead não encontrada</p>
            <button
              onClick={() => router.push("/backoffice/leads")}
              className="mt-4 text-sm text-[#E10600] hover:underline"
            >
              Ver todas as leads
            </button>
          </div>
        )}
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
