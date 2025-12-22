'use client';

import Image from "next/image";
import { BackofficeLayout } from "../../../../backoffice/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";

export default function AgentesMapaPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Mapa de agentes">
        <Image src="/renders/21.jpg" alt="Mapa agentes render placeholder" width={1920} height={1080} className="w-full rounded-2xl" />
        <p className="mt-2 text-xs text-[#C5C5C5]">TODO: implementar mapa real de agentes quando API fornecer coordenadas.</p>
      </BackofficeLayout>
    </ToastProvider>
  );
}
