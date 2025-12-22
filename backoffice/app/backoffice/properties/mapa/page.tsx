'use client';

import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";

export default function PropertiesMapPage() {
  return (
    <BackofficeLayout title="Mapa de propriedades">
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-sm text-[#C5C5C5]">
        <p>Mapa de propriedades (placeholder). Integrar mapa real ou embed conforme backend/SDK.</p>
      </div>
    </BackofficeLayout>
  );
}
