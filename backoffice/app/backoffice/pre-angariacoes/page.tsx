"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";
import { getPreAngariacoes, cancelPreAngariacao, type PreAngariacaoListItem } from "../../../src/services/backofficeApi";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";

function PreAngariacoesInner() {
  const { push } = useToast();
  const router = useRouter();
  const { sector } = useTenant();
  const { term } = useTerminology();
  const [items, setItems] = useState<PreAngariacaoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");

  // Título dinâmico baseado no sector
  const pageTitle = sector === 'automotive' ? 'Pré-Avaliações' : 
                    sector === 'real_estate' ? 'Pré-Angariações' : 
                    'Pré-Registos';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPreAngariacoes({ status: status || undefined, limit: 100 });
        // Ocultar cancelados por omissão (a menos que o filtro explicite)
        const filtered = status
          ? data
          : data.filter((item) => item.status !== "cancelado");
        setItems(filtered);
      } catch (error: any) {
        console.error(`Erro ao carregar ${pageTitle.toLowerCase()}:`, error);
        push(`Erro ao carregar ${pageTitle.toLowerCase()}`, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, push]);

  return (
    <BackofficeLayout title={pageTitle}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-[#C5C5C5]">
            Visibilidade total (apenas administradores). Todas as avaliações/pastas iniciadas pelos {term('agents', 'agentes').toLowerCase()}.
          </p>
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
        <div className="grid grid-cols-[1.1fr_1fr_0.9fr_0.7fr_0.8fr] gap-3 border-b border-[#1F1F22] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#888] md:grid-cols-[1.1fr_1fr_0.9fr_0.7fr_0.7fr_0.8fr]">
          <span>Proprietário</span>
          <span>{term('agent', 'Agente')}</span>
          <span>Morada</span>
          <span>Status</span>
          <span className="hidden md:block">Data</span>
          <span>Progresso</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-[#C5C5C5]">A carregar...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-[#C5C5C5]">Nenhuma pré-angariação encontrada.</div>
        ) : (
          items.map((item) => {
            const handleCancel = async (e: React.MouseEvent) => {
              e.stopPropagation();
              try {
                await cancelPreAngariacao(item.id);
                setItems((prev) => prev.filter((p) => p.id !== item.id));
                push("Pré-angariação cancelada.", "success");
              } catch (error: any) {
                console.error("Erro ao cancelar:", error);
                push(`Erro ao cancelar ${pageTitle.slice(0, -1).toLowerCase()}`, "error");
              }
            };

            return (
              <div
                key={item.id}
                role="button"
                onClick={() => router.push(`/backoffice/pre-angariacoes/${item.id}`)}
                className="relative grid cursor-pointer grid-cols-[1.1fr_1fr_0.9fr_0.7fr_0.8fr] gap-3 border-b border-[#1F1F22] px-4 py-3 text-sm text-white transition hover:bg-[#151518] md:grid-cols-[1.1fr_1fr_0.9fr_0.7fr_0.7fr_0.8fr]"
              >
                <div>
                  <div className="font-semibold">{item.proprietario_nome}</div>
                  <div className="text-xs text-[#C5C5C5]">{item.referencia_interna || `PA-${item.id}`}</div>
                </div>
                <div className="text-xs text-[#C5C5C5] md:text-sm">
                  {item.agent_name || `${term('agent', 'Agente')} #${item.agent_id}`}
                </div>
                <div className="text-[#C5C5C5] text-xs md:text-sm" title={item.morada || undefined}>
                  {item.morada || '—'}
                </div>
                <div className="text-xs font-semibold uppercase text-[#E10600]">
                  {item.status}
                </div>
                <div className="hidden text-xs text-[#C5C5C5] md:block">
                  {new Date(item.created_at).toLocaleDateString('pt-PT')}
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

                <button
                  onClick={handleCancel}
                  className="absolute right-3 top-3 rounded-full p-1.5 text-[#ef4444] hover:bg-[#1f1f22]"
                  title={`Cancelar/ocultar para o ${term('agent', 'agente').toLowerCase()}`}
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            );
          })
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
