'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";
import { CalendarIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useTerminology } from "@/context/TerminologyContext";

type Props = { params: { id: string } };

type Visit = {
  id: number;
  referencia: string;
  lead_name: string;
  agent_name: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
};

export default function AgendamentoDetalhePage({ params }: Props) {
  const router = useRouter();
  const { term } = useTerminology();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Buscar agendamento real da API quando endpoint existir
    // fetch(`/api/visits/${params.id}`)
    setLoading(false);
  }, [params.id]);

  return (
    <ToastProvider>
      <BackofficeLayout title={`${term('visit_singular', 'Agendamento')} ${params.id}`}>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-[#999] hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </button>

        {loading ? (
          <div className="py-12 text-center text-[#999]">A carregar...</div>
        ) : visit ? (
          <div className="space-y-4 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-5 text-white">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{visit.referencia}</p>
                <p className="text-sm text-[#C5C5C5]">Lead: {visit.lead_name}</p>
              </div>
              <span className="rounded-full bg-[#1F1F22] px-3 py-1 text-xs">{visit.status}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Data" value={visit.scheduled_at} />
              <Info label={term('agent', 'Comercial')} value={visit.agent_name} />
              <Info label="Estado" value={visit.status} />
            </div>
            {visit.notes && (
              <div>
                <p className="text-sm text-[#C5C5C5]">Notas</p>
                <p className="text-sm text-white">{visit.notes}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 text-sm">
              <button className="rounded-lg bg-[#E10600] px-4 py-2 text-white hover:bg-[#c00500]">Reagendar</button>
              <button className="rounded-lg border border-[#2A2A2E] bg-[#101013] px-4 py-2 text-white hover:border-[#E10600]">Concluir</button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-[#555]" />
            <p className="mt-4 text-[#999]">{term('visit_singular', 'Agendamento')} não encontrado</p>
            <button
              onClick={() => router.push("/backoffice/agenda")}
              className="mt-4 text-sm text-[#E10600] hover:underline"
            >
              Ver todos os {term('visits', 'agendamentos').toLowerCase()}
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