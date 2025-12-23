"use client";

import { useEffect, useState } from "react";
import { BackofficeLayout } from "../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../backoffice/components/ToastProvider";
import { getPreAngariacoes, type PreAngariacaoListItem } from "../../src/services/backofficeApi";

function PreAngariacoesInner() {
  const toast = useToast();
  const [items, setItems] = useState<PreAngariacaoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPreAngariacoes({ status: status || undefined, limit: 200 });
        setItems(data);
      } catch (error: any) {
        console.error("Erro ao carregar pré-angariações:", error);
        toast?.push("Erro ao carregar pré-angariações", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, toast]);

  return (
    <BackofficeLayout title="Pré-Angariações" subtitle="Todas as visitas e dossiês criados pelos agentes">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[#C5C5C5]">Visibilidade total (apenas administradores)</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#888]">Filtrar por status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-[#2A2A2E] bg-[#0F0F10] px-3 py-2 text-sm text-white"
          >
            <option value="">Todos</option>
            <option value="inicial">Inicial</option>
            <option value="em_progresso">Em progresso</option>
            <option value="docs_ok">Documentos OK</option>
            <option value="fotos_ok">Fotos OK</option>
            <option value="contrato_ok">Contrato OK</option>
            <option value="completo">Completo</option>
            <option value="activado">Ativado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
        <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] gap-3 border-b border-[#1F1F22] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#888] md:grid-cols-[1.3fr_1fr_0.6fr_0.6fr_0.6fr]">
          <span>Proprietário</span>
          <span>Morada</span>
          <span>Status</span>
          <span>Progresso</span>
          <span className="hidden md:block">Criado</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-[#C5C5C5]">A carregar...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-[#C5C5C5]">Nenhuma pré-angariação encontrada.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] gap-3 border-b border-[#1F1F22] px-4 py-3 text-sm text-white md:grid-cols-[1.3fr_1fr_0.6fr_0.6fr_0.6fr]"
            >
              <div>
                <div className="font-semibold">{item.proprietario_nome}</div>
                <div className="text-xs text-[#C5C5C5]">{item.referencia_interna || `PA-${item.id}`}</div>
              </div>
              <div className="text-[#C5C5C5] text-xs md:text-sm" title={item.morada || undefined}>
                {item.morada || '—'}
              </div>
              <div className="text-xs font-semibold uppercase text-[#E10600]">
                {item.status}
              </div>
              <div className="text-xs text-[#C5C5C5]">
                <div className="h-2 w-full rounded-full bg-[#1F1F22]">
                  <div
                    className="h-2 rounded-full bg-[#E10600]"
                    style={{ width: `${item.progresso}%` }}
                  />
                </div>
                <span className="text-[11px]">{item.progresso}%</span>
              </div>
              <div className="hidden text-xs text-[#C5C5C5] md:block">
                {new Date(item.created_at).toLocaleDateString('pt-PT')}
              </div>
            </div>
          ))
        )}
      </div>
    </BackofficeLayout>
  );
}

export default function PreAngariacoesPage() {
  return (
    <ToastProvider>
      <PreAngariacoesInner />
    </ToastProvider>
  );
}
