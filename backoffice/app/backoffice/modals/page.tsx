'use client';

import { useState } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";

export default function ModaisPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Modais críticos">
        <ModalDemo />
      </BackofficeLayout>
    </ToastProvider>
  );
}

function ModalDemo() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSession, setOpenSession] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button className="rounded-lg bg-[#101013] px-4 py-2 text-sm text-white ring-1 ring-[#2A2A2E]" onClick={() => setOpenConfirm(true)}>
          Abrir modal de exclusão
        </button>
        <button className="rounded-lg bg-[#101013] px-4 py-2 text-sm text-white ring-1 ring-[#2A2A2E]" onClick={() => setOpenSession(true)}>
          Abrir modal de sessão terminada
        </button>
      </div>

      {openConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-white">
            <h3 className="text-lg font-semibold">Eliminar imóvel</h3>
            <p className="mt-2 text-sm text-[#C5C5C5]">Esta ação é irreversível. Confirma que pretendes eliminar?</p>
            <div className="mt-4 flex justify-end gap-3 text-sm">
              <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]" onClick={() => setOpenConfirm(false)}>
                Cancelar
              </button>
              <button className="rounded-lg bg-[#E10600] px-3 py-2 text-white" onClick={() => setOpenConfirm(false)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {openSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-white text-center">
            <h3 className="text-lg font-semibold">Sessão terminada</h3>
            <p className="mt-2 text-sm text-[#C5C5C5]">Inicia sessão novamente para continuares.</p>
            <div className="mt-4 flex justify-center gap-3 text-sm">
              <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]" onClick={() => setOpenSession(false)}>
                Fechar
              </button>
              <button className="rounded-lg bg-[#E10600] px-3 py-2 text-white">Iniciar sessão</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-[#C5C5C5]">UI funcional; ligar a fluxos reais de eliminação/sessão quando aplicável.</p>
    </div>
  );
}
