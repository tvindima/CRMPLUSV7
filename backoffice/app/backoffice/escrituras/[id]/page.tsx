"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { BackofficeLayout } from "../../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

interface Escritura {
  id: number;
  property_id: number | null;
  agent_id: number;
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

// Checklist de documentos padrão
const CHECKLIST_DOCS = [
  { id: "certidao_permanente", nome: "Certidão Permanente Atualizada", obrigatorio: true },
  { id: "direito_preferencia", nome: "Direito de Preferência", obrigatorio: true },
  { id: "licenca_utilizacao", nome: "Licença de Utilização", obrigatorio: true },
  { id: "ficha_tecnica", nome: "Ficha Técnica da Habitação", obrigatorio: false },
  { id: "certificado_energetico", nome: "Certificado Energético", obrigatorio: true },
  { id: "caderneta_predial", nome: "Caderneta Predial Atualizada", obrigatorio: true },
  { id: "docs_vendedor", nome: "Documentos do Vendedor (CC/NIF)", obrigatorio: true },
  { id: "docs_comprador", nome: "Documentos do Comprador (CC/NIF)", obrigatorio: true },
  { id: "procuracoes", nome: "Procurações (se aplicável)", obrigatorio: false },
  { id: "distrate_hipoteca", nome: "Distrate de Hipoteca (se aplicável)", obrigatorio: false },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  agendada: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Agendada" },
  confirmada: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Confirmada" },
  realizada: { bg: "bg-green-500/20", text: "text-green-400", label: "Realizada" },
  cancelada: { bg: "bg-red-500/20", text: "text-red-400", label: "Cancelada" },
  adiada: { bg: "bg-orange-500/20", text: "text-orange-400", label: "Adiada" },
};

function EscrituraDetailInner() {
  const { push } = useToast();
  const router = useRouter();
  const params = useParams();
  const escrituraId = params?.id as string;

  const [escritura, setEscritura] = useState<Escritura | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notasDocumentacao, setNotasDocumentacao] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // Usar proxy route em vez de chamada direta
      const res = await fetch(`/api/escrituras/${escrituraId}`);

      if (!res.ok) {
        if (res.status === 401) {
          push("Sessão expirada", "error");
          router.push("/backoffice/login");
          return;
        }
        throw new Error("Escritura não encontrada");
      }
      
      const data = await res.json();
      setEscritura(data);
      setNotasDocumentacao(data.notas_documentacao || "");
      
      // Inicializar checklist vazio
      const initialChecklist: Record<string, boolean> = {};
      CHECKLIST_DOCS.forEach((doc) => {
        initialChecklist[doc.id] = false;
      });
      setChecklist(initialChecklist);
    } catch (error: any) {
      console.error("Erro:", error);
      push(error.message || "Erro ao carregar dados", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (escrituraId) {
      loadData();
    }
  }, [escrituraId]);

  const updateStatus = async (newStatus: string) => {
    try {
      setSaving(true);

      // Usar proxy route
      const res = await fetch(`/api/escrituras/${escrituraId}/status?status=${newStatus}`, {
        method: "PATCH",
      });

      if (res.ok) {
        push(`Status atualizado para ${STATUS_STYLES[newStatus]?.label || newStatus}`, "success");
        loadData();
      }
    } catch (error) {
      push("Erro ao atualizar status", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateDocumentacao = async (pronta: boolean) => {
    try {
      setSaving(true);

      // Usar proxy route
      let url = `/api/escrituras/${escrituraId}/documentacao?pronta=${pronta}`;
      if (notasDocumentacao) {
        url += `&notas=${encodeURIComponent(notasDocumentacao)}`;
      }
      
      const res = await fetch(url, {
        method: "PATCH",
      });

      if (res.ok) {
        push(`Documentação marcada como ${pronta ? 'pronta' : 'pendente'}`, "success");
        loadData();
      }
    } catch (error) {
      push("Erro ao atualizar documentação", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (docId: string) => {
    setChecklist((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getChecklistProgress = () => {
    const total = CHECKLIST_DOCS.filter((d) => d.obrigatorio).length;
    const completed = CHECKLIST_DOCS.filter((d) => d.obrigatorio && checklist[d.id]).length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <BackofficeLayout title="Escritura">
        <div className="flex items-center justify-center py-20">
          <div className="text-[#C5C5C5]">A carregar...</div>
        </div>
      </BackofficeLayout>
    );
  }

  if (!escritura) {
    return (
      <BackofficeLayout title="Escritura">
        <div className="flex items-center justify-center py-20">
          <div className="text-red-400">Escritura não encontrada</div>
        </div>
      </BackofficeLayout>
    );
  }

  const daysUntil = getDaysUntil(escritura.data_escritura);
  const isUrgent = daysUntil <= 7 && daysUntil >= 0;
  const statusStyle = STATUS_STYLES[escritura.status] || STATUS_STYLES.agendada;
  const checklistProgress = getChecklistProgress();

  return (
    <BackofficeLayout title={`Escritura #${escritura.id}`}>
      {/* Header com botão voltar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#888] hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar à lista
        </button>
        
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
          {isUrgent && !escritura.documentacao_pronta && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {daysUntil === 0 ? "HOJE" : `${daysUntil} dias`}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Data e Local */}
          <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <CalendarIcon className="h-5 w-5 text-[#E10600]" />
              Data e Local
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-[#888]">Data</p>
                <p className="text-lg font-semibold text-white">{formatDate(escritura.data_escritura)}</p>
                <p className="text-sm text-[#C5C5C5]">às {escritura.hora_escritura || "—"}</p>
              </div>
              
              <div>
                <p className="text-xs text-[#888]">Local (Cartório/Notário)</p>
                <p className="text-lg font-semibold text-white">{escritura.local_escritura || "—"}</p>
                {escritura.morada_cartorio && (
                  <p className="text-sm text-[#C5C5C5]">{escritura.morada_cartorio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Partes Envolvidas */}
          <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <UserIcon className="h-5 w-5 text-[#E10600]" />
              Partes Envolvidas
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Vendedor */}
              <div className="rounded-lg border border-[#2A2A2E] bg-[#151518] p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-[#888]">Vendedor</p>
                <p className="text-lg font-semibold text-white">{escritura.nome_vendedor || "—"}</p>
                {escritura.nif_vendedor && (
                  <p className="text-sm text-[#C5C5C5]">NIF: {escritura.nif_vendedor}</p>
                )}
              </div>

              {/* Comprador */}
              <div className="rounded-lg border border-[#2A2A2E] bg-[#151518] p-4">
                <p className="mb-2 text-xs font-semibold uppercase text-[#888]">Comprador</p>
                <p className="text-lg font-semibold text-white">{escritura.nome_comprador || "—"}</p>
                {escritura.nif_comprador && (
                  <p className="text-sm text-[#C5C5C5]">NIF: {escritura.nif_comprador}</p>
                )}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <CurrencyEuroIcon className="h-5 w-5 text-[#E10600]" />
              Valores
            </h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-[#888]">Valor de Venda</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(escritura.valor_venda)}</p>
              </div>
              
              <div>
                <p className="text-xs text-[#888]">Comissão ({escritura.percentagem_comissao || "—"}%)</p>
                <p className="text-2xl font-bold text-[#E10600]">{formatCurrency(escritura.valor_comissao)}</p>
              </div>
              
              <div>
                <p className="text-xs text-[#888]">Fatura</p>
                <p className={`text-lg font-semibold ${escritura.fatura_emitida ? 'text-green-400' : 'text-yellow-400'}`}>
                  {escritura.fatura_emitida ? `#${escritura.numero_fatura}` : "Pendente"}
                </p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {escritura.notas && (
            <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <DocumentTextIcon className="h-5 w-5 text-[#E10600]" />
                Notas do Agente
              </h2>
              <p className="whitespace-pre-wrap text-sm text-[#C5C5C5]">{escritura.notas}</p>
            </div>
          )}
        </div>

        {/* Coluna Lateral - Checklist e Ações */}
        <div className="space-y-6">
          {/* Status & Ações */}
          <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Ações</h2>
            
            <div className="space-y-4">
              {/* Alterar Status */}
              <div>
                <label className="mb-2 block text-xs text-[#888]">Status</label>
                <select
                  value={escritura.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white"
                >
                  <option value="agendada">Agendada</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="adiada">Adiada</option>
                </select>
              </div>

              {/* Documentação */}
              <div>
                <label className="mb-2 block text-xs text-[#888]">Documentação</label>
                <button
                  onClick={() => updateDocumentacao(!escritura.documentacao_pronta)}
                  disabled={saving}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    escritura.documentacao_pronta
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  }`}
                >
                  {escritura.documentacao_pronta ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Documentação Pronta
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-5 w-5" />
                      Marcar como Pronta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Checklist de Documentos */}
          <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <DocumentCheckIcon className="h-5 w-5 text-[#E10600]" />
                Checklist
              </h2>
              <span className="text-sm text-[#888]">
                {checklistProgress.completed}/{checklistProgress.total} ({checklistProgress.percentage}%)
              </span>
            </div>
            
            {/* Barra de progresso */}
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#2A2A2E]">
              <div
                className="h-full bg-[#E10600] transition-all"
                style={{ width: `${checklistProgress.percentage}%` }}
              />
            </div>

            <div className="space-y-2">
              {CHECKLIST_DOCS.map((doc) => (
                <label
                  key={doc.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-[#151518] ${
                    checklist[doc.id] ? "bg-green-500/10" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[doc.id]}
                    onChange={() => toggleChecklistItem(doc.id)}
                    className="h-4 w-4 rounded border-[#2A2A2E] bg-[#151518] text-[#E10600]"
                  />
                  <span className={`text-sm ${checklist[doc.id] ? "text-green-400 line-through" : "text-[#C5C5C5]"}`}>
                    {doc.nome}
                    {doc.obrigatorio && <span className="ml-1 text-red-400">*</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notas de Documentação */}
          <div className="rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <PencilIcon className="h-5 w-5 text-[#E10600]" />
              Notas (Staff)
            </h2>
            
            <textarea
              value={notasDocumentacao}
              onChange={(e) => setNotasDocumentacao(e.target.value)}
              placeholder="Adicione notas sobre a documentação..."
              rows={4}
              className="w-full rounded-lg border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white placeholder-[#666]"
            />
            
            <button
              onClick={() => updateDocumentacao(escritura.documentacao_pronta)}
              disabled={saving}
              className="mt-3 w-full rounded-lg bg-[#E10600] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c00500]"
            >
              {saving ? "A guardar..." : "Guardar Notas"}
            </button>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}

export default function EscrituraDetailPage() {
  return (
    <ToastProvider>
      <EscrituraDetailInner />
    </ToastProvider>
  );
}
