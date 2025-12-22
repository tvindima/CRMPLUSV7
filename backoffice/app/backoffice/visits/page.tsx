'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { PlusIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function VisitsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <BackofficeLayout title="Visitas">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Visitas</h1>
          <p className="text-sm text-[#999]">Gerir visitas a imóveis</p>
        </div>
        <button
          onClick={() => router.push("/backoffice/visits/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Agendar Visita
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar visitas...</div>
      ) : (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhuma visita agendada</p>
          <button
            onClick={() => router.push("/backoffice/visits/new")}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Agendar primeira visita
          </button>
        </div>
      )}
    </BackofficeLayout>
  );
}
