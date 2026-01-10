'use client';

import { BackofficeLayout } from "@/components/BackofficeLayout";
import { useTerminology } from "@/context/TerminologyContext";

export default function PropertiesMapPage() {
  const { term } = useTerminology();
  
  return (
    <BackofficeLayout title={`Mapa de ${term('items', 'itens')}`}>
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-sm text-[#C5C5C5]">
        <p>Mapa de {term('items', 'itens').toLowerCase()} (placeholder). Integrar mapa real ou embed conforme backend/SDK.</p>
      </div>
    </BackofficeLayout>
  );
}
