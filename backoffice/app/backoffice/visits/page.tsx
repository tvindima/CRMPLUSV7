'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";

export default function VisitsPage() {
  const router = useRouter();
  const { sector } = useTenant();
  const { term } = useTerminology();
  const [loading, setLoading] = useState(true);

  // Terminologia dinâmica para visitas
  const visitsLabel = term('visits', 'Visitas');
  const visitLabel = term('visit_singular', 'Visita');
  const itemLabel = term('item_plural', 'itens');

  useEffect(() => {
    setLoading(false);
  }, []);

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
      ) : (
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
      )}
    </BackofficeLayout>
  );
}
