'use client';

import Image from "next/image";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";
import { useTerminology } from "@/context/TerminologyContext";

export default function AgentesMapaPage() {
  const { term } = useTerminology();
  const agentsLabel = term('agents', 'agentes');
  
  return (
    <ToastProvider>
      <BackofficeLayout title={`Mapa de ${agentsLabel.toLowerCase()}`}>
        <Image src="/renders/21.png" alt={`Mapa ${agentsLabel.toLowerCase()} render placeholder`} width={1920} height={1080} className="w-full rounded-2xl" />
        <p className="mt-2 text-xs text-[#C5C5C5]">TODO: implementar mapa real de {agentsLabel.toLowerCase()} quando API fornecer coordenadas.</p>
      </BackofficeLayout>
    </ToastProvider>
  );
}
