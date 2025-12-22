'use client';

import Image from "next/image";
import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { StatCard } from "../../../backoffice/components/Card";

const barData = [
  { label: "Nazaré", value: 6.8 },
  { label: "Batalha", value: 4.5 },
  { label: "Leiria", value: 2.0 },
];

export default function DashboardPage() {
  return (
    <BackofficeLayout title="Dashboard">
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard title="Total Imóveis" value="15" />
        <StatCard title="Novas Leads" value="—" />
        <StatCard title="Visitas Agendadas" value="—" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[#131315] bg-[#0F0F10] p-5 text-white">
          <p className="text-lg font-semibold">Imóveis por concelho</p>
          <div className="mt-6 grid h-72 grid-cols-3 items-end gap-6">
            {barData.map((bar) => (
              <div key={bar.label} className="flex flex-col items-center gap-3">
                <div className="w-full max-w-[120px] rounded-md bg-gradient-to-t from-[#A30808] via-[#BD0C0C] to-[#D20E0E] shadow-[0_-6px_30px_rgba(210,14,14,0.35)]" style={{ height: `${bar.value * 20}px` }} />
                <span className="text-sm text-[#C5C5C5]">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#131315] bg-[#0F0F10] p-5 text-white">
          <p className="text-lg font-semibold">Follow-up leads</p>
          <div className="mt-5 space-y-4 text-sm text-[#C5C5C5]">
            <p>Confirmar visitas</p>
            <p>Atualizar angariações</p>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}
