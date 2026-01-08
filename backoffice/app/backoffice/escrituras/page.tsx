"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";
import { getSession } from "../../../src/services/auth";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  CurrencyEuroIcon,
  DocumentCheckIcon,
  XCircleIcon,
  PhoneIcon,
  PencilIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface Escritura {
  id: number;
  property_id: number | null;
  agent_id: number;
  agency_id: number | null;
  client_id: number | null;
  data_escritura: string;
  hora_escritura: string | null;
  local_escritura: string | null;
  morada_cartorio: string | null;
  nome_comprador: string | null;
  nif_comprador: string | null;
  nome_vendedor: string | null;
  nif_vendedor: string | null;
  valor_venda: number;
  valor_comissao: number | null;
  percentagem_comissao: number | null;
  status: string;
  documentacao_pronta: boolean;
  notas_documentacao: string | null;
  fatura_emitida: boolean;
  numero_fatura: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string | null;
}

interface EscrituraStats {
  total: number;
  urgentes: number;
  proximas: number;
  pendentes_documentacao: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  agendada: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Agendada" },
  confirmada: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Confirmada" },
  realizada: { bg: "bg-green-500/20", text: "text-green-400", label: "Realizada" },
  cancelada: { bg: "bg-red-500/20", text: "text-red-400", label: "Cancelada" },
  adiada: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Adiada" },
};

function EscriturasInner() {
  const { push } = useToast();
  const router = useRouter();
  const [escrituras, setEscrituras] = useState<Escritura[]>([]);
  const [stats, setStats] = useState<EscrituraStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pendentesOnly, setPendentesOnly] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session?.token) {
        push("Sessão expirada", "error");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://crmplusv7-production.up.railway.app";

      // Carregar estatísticas
      const statsRes = await fetch(`${baseUrl}/escrituras/proximas?dias=60`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          total: statsData.total,
          urgentes: statsData.urgentes?.length || 0,
          proximas: statsData.proximas?.length || 0,
          pendentes_documentacao: statsData.pendentes_documentacao || 0,
        });
      }

      // Carregar lista completa
      let url = `${baseUrl}/escrituras/?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (pendentesOnly) url += `&pendentes_documentacao=true`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (!res.ok) throw new Error("Erro ao carregar escrituras");
      
      const data = await res.json();
      setEscrituras(data.items || []);
    } catch (error: any) {
      console.error("Erro:", error);
      push(error.message || "Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, pendentesOnly]);

  const updateDocumentacao = async (id: number, pronta: boolean) => {
    try {
      const session = await getSession();
      if (!session?.token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://crmplusv7-production.up.railway.app";
      const res = await fetch(`${baseUrl}/escrituras/${id}/documentacao?pronta=${pronta}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (res.ok) {
        push(`Documentação marcada como ${pronta ? 'pronta' : 'pendente'}`, "success");
        loadData();
      }
    } catch (error) {
      push("Erro ao atualizar documentação", "error");
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const session = await getSession();
      if (!session?.token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://crmplusv7-production.up.railway.app";
      const res = await fetch(`${baseUrl}/escrituras/${id}/status?status=${newStatus}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (res.ok) {
        push(`Status atualizado para ${STATUS_STYLES[newStatus]?.label || newStatus}`, "success");
        loadData();
      }
    } catch (error) {
      push("Erro ao atualizar status", "error");
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <BackofficeLayout title="Escrituras">
      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <CalendarIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-xs text-[#888]">Próximas 60 dias</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.urgentes || 0}</p>
              <p className="text-xs text-[#888]">Urgentes (7 dias)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
              <DocumentTextIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.pendentes_documentacao || 0}</p>
              <p className="text-xs text-[#888]">Docs Pendentes</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
              <DocumentCheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.proximas || 0}</p>
              <p className="text-xs text-[#888]">Docs OK</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={pendentesOnly}
              onChange={(e) => setPendentesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-[#2A2A2E] bg-[#0F0F10] text-red-500"
            />
            <span className="text-sm text-[#C5C5C5]">Apenas pendentes documentação</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#888]">Filtrar por status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-[#2A2A2E] bg-[#0F0F10] px-3 py-2 text-sm text-white"
          >
            <option value="">Todos</option>
            <option value="agendada">Agendada</option>
            <option value="confirmada">Confirmada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
            <option value="adiada">Adiada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F1F22] text-xs font-semibold uppercase tracking-wide text-[#888]">
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Local</th>
                <th className="px-4 py-3 text-left">Partes</th>
                <th className="px-4 py-3 text-left">Valor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Docs</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-[#C5C5C5]">
                    A carregar...
                  </td>
                </tr>
              ) : escrituras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-sm text-[#C5C5C5]">
                    Nenhuma escritura encontrada.
                  </td>
                </tr>
              ) : (
                escrituras.map((escritura) => {
                  const daysUntil = getDaysUntil(escritura.data_escritura);
                  const isUrgent = daysUntil <= 7 && daysUntil >= 0;
                  const isPast = daysUntil < 0;
                  const statusStyle = STATUS_STYLES[escritura.status] || STATUS_STYLES.agendada;

                  return (
                    <tr
                      key={escritura.id}
                      className={`border-b border-[#1F1F22] text-sm text-white transition hover:bg-[#151518] ${
                        isUrgent && !escritura.documentacao_pronta ? "bg-red-500/5" : ""
                      }`}
                    >
                      {/* Data */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className={`h-4 w-4 ${isUrgent ? "text-red-400" : "text-[#888]"}`} />
                          <div>
                            <p className={`font-semibold ${isUrgent ? "text-red-400" : ""}`}>
                              {formatDate(escritura.data_escritura)}
                            </p>
                            <p className="text-xs text-[#888]">
                              {escritura.hora_escritura || "—"}
                              {isUrgent && !isPast && (
                                <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-red-400">
                                  {daysUntil === 0 ? "HOJE" : `${daysUntil}d`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Local */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="mt-0.5 h-4 w-4 text-[#888]" />
                          <div className="max-w-[200px]">
                            <p className="font-medium">{escritura.local_escritura || "—"}</p>
                            {escritura.morada_cartorio && (
                              <p className="truncate text-xs text-[#888]">{escritura.morada_cartorio}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Partes */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#888]">V:</span>
                            <span className="text-sm">{escritura.nome_vendedor || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[#888]">C:</span>
                            <span className="text-sm">{escritura.nome_comprador || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-green-400">{formatCurrency(escritura.valor_venda)}</p>
                          {escritura.valor_comissao && (
                            <p className="text-xs text-[#888]">
                              Comissão: {formatCurrency(escritura.valor_comissao)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={escritura.status}
                          onChange={(e) => updateStatus(escritura.id, e.target.value)}
                          className={`rounded px-2 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} cursor-pointer border-none outline-none`}
                        >
                          <option value="agendada">Agendada</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="realizada">Realizada</option>
                          <option value="cancelada">Cancelada</option>
                          <option value="adiada">Adiada</option>
                        </select>
                      </td>

                      {/* Documentação */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => updateDocumentacao(escritura.id, !escritura.documentacao_pronta)}
                          className={`rounded-lg p-2 transition ${
                            escritura.documentacao_pronta
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                          }`}
                          title={escritura.documentacao_pronta ? "Documentação pronta" : "Documentação pendente"}
                        >
                          {escritura.documentacao_pronta ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <ClockIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/backoffice/escrituras/${escritura.id}`)}
                            className="rounded-lg p-2 text-[#888] transition hover:bg-[#1F1F22] hover:text-white"
                            title="Ver detalhes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Checklist de Documentos */}
      <div className="mt-6 rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <DocumentTextIcon className="h-5 w-5 text-[#E10600]" />
          Checklist de Documentos por Escritura
        </h3>
        <div className="grid gap-2 text-xs text-[#C5C5C5] md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E10600]" />
            Certidão Permanente Atualizada
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E10600]" />
            Direito de Preferência
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E10600]" />
            Licença de Utilização
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E10600]" />
            Certificado Energético
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E10600]" />
            Caderneta Predial Atualizada
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E10600]" />
            Documentos das Partes
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}

export default function EscriturasPage() {
  return (
    <ToastProvider>
      <EscriturasInner />
    </ToastProvider>
  );
}
