'use client';

import { BrandImage } from "../../../../components/BrandImage";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../../backoffice/components/ToastProvider";

export default function BrandingPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Branding / Notificações">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
            <p className="text-lg font-semibold">Branding</p>
            <div className="flex gap-3">
              <BrandImage src="/brand/logoCRMPLUSS.png" alt="Logo CRM PLUS" width={120} height={120} className="rounded-lg bg-[#0B0B0D] p-2" />
              <BrandImage src="/brand/logo sem fundo .svg" alt="Logo CRM PLUS horizontal" width={120} height={120} className="rounded-lg bg-[#0B0B0D] p-2" />
            </div>
            <p className="text-xs text-[#C5C5C5]">TODO: permitir upload/substituição de logos quando backend suportar.</p>
          </div>
          <div className="space-y-3 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
            <p className="text-lg font-semibold">Notificações</p>
            <div className="space-y-2 text-sm text-[#C5C5C5]">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#E10600]" /> Leads atribuídas
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#E10600]" /> Visitas agendadas
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-[#E10600]" /> Alertas críticos
              </label>
            </div>
            <p className="text-xs text-[#C5C5C5]">TODO: ligar estados às preferências reais quando houver endpoint.</p>
          </div>
        </div>
      </BackofficeLayout>
    </ToastProvider>
  );
}
