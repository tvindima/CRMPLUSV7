'use client';

import { useEffect, useMemo, useState } from "react";
import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";
import { DataTable } from "../../../backoffice/components/DataTable";
import { Drawer } from "../../../backoffice/components/Drawer";
import { LeadForm, LeadFormSubmit } from "../../../backoffice/components/LeadForm";
import { useRole } from "../../../backoffice/context/roleContext";
import { useTerminology } from "@/context/TerminologyContext";
import {
  BackofficeLead,
  createBackofficeLead,
  deleteBackofficeLead,
  getBackofficeLeads,
  updateBackofficeLead,
  LeadStatus,
  LeadSource,
} from "../../../src/services/backofficeApi";

export default function LeadsPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Leads">
        <LeadsInner />
      </BackofficeLayout>
    </ToastProvider>
  );
}

function LeadsInner() {
  const toast = useToast();
  const { permissions } = useRole();
  const { term } = useTerminology();

  const [items, setItems] = useState<BackofficeLead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | LeadSource>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sourceLabels: Record<LeadSource, string> = {
    portal: "Portal",
    website: "Website",
    manual: "Manual",
    phone: "Telefone",
    email: "Email",
    referral: "Referência",
    social: "Redes Sociais",
    other: "Outro",
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, sourceFilter]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await getBackofficeLeads({
        search: search || undefined,
        source: sourceFilter !== "all" ? sourceFilter : undefined,
        limit: 100,
      });
      setItems(data);
    } catch (err: any) {
      toast.push(err?.message || "Erro ao carregar leads", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((lead) => {
      const matchesSearch =
        !search ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
        (lead.phone && lead.phone.includes(search));
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [items, search, statusFilter, sourceFilter]);

  const formatSource = (lead: BackofficeLead) => {
    const label = sourceLabels[lead.source || "other"] || lead.source || "—";
    if (lead.source === "portal" && lead.portal_name) {
      return `${label} (${lead.portal_name})`;
    }
    return label;
  };

  const current = editingId ? items.find((i) => i.id === editingId) : undefined;

  const handleSubmit = async ({ payload }: LeadFormSubmit) => {
    setSaving(true);
    try {
      if (mode === "create") {
        await createBackofficeLead(payload);
        toast.push("Lead criada", "success");
      } else if (editingId) {
        await updateBackofficeLead(editingId, payload);
        toast.push("Lead atualizada", "success");
      }
      setDrawerOpen(false);
      await loadLeads();
    } catch (err: any) {
      toast.push(err?.message || "Erro ao guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja eliminar esta lead?")) return;
    try {
      await deleteBackofficeLead(id);
      toast.push("Lead eliminada", "success");
      await loadLeads();
    } catch (err: any) {
      toast.push(err?.message || "Erro ao eliminar", "error");
    }
  };

  const visitLabel = term('visit', 'Visita');
  const statusLabels: Record<LeadStatus, string> = {
    new: "Nova",
    contacted: "Contactada",
    qualified: "Qualificada",
    proposal_sent: "Proposta Enviada",
    visit_scheduled: `${visitLabel} Agendada`,
    negotiation: "Em Negociação",
    converted: "Convertida",
    lost: "Perdida",
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("pt-PT");
    } catch {
      return "—";
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome, email ou telefone"
          className="w-full max-w-xs rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="all">Todos os estados</option>
          <option value="new">Nova</option>
          <option value="contacted">Contactada</option>
          <option value="qualified">Qualificada</option>
          <option value="lost">Perdida</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as LeadSource | "all")}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="all">Todas as origens</option>
          <option value="portal">Portal (Idealista, etc.)</option>
          <option value="website">Website</option>
          <option value="manual">Manual</option>
          <option value="phone">Telefone</option>
          <option value="referral">Referência</option>
        </select>
        {permissions.canEditAllProperties && (
          <button
            onClick={() => {
              setMode("create");
              setEditingId(null);
              setDrawerOpen(true);
            }}
            className="rounded bg-[#0F0F10] px-4 py-2 text-sm font-semibold text-white ring-1 ring-[#2A2A2E] hover:ring-[#E10600]"
          >
            Nova Lead
          </button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#C5C5C5]">A carregar leads...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
          <DataTable
            dense
            columns={["Nome", "Email", "Telefone", "Canal", "Estado", "Criado", term('agent', 'Agente')]}
            rows={filtered.map((lead) => [
              lead.name,
              lead.email || "—",
              lead.phone || "—",
              formatSource(lead),
              statusLabels[lead.status] || lead.status,
              formatDate(lead.created_at),
              lead.assigned_agent_id ? `${term('agent', 'Agente')} #${lead.assigned_agent_id}` : "Não atribuído",
            ])}
            actions={
              permissions.canEditAllProperties
                ? ["Ver", "Editar", "Eliminar"]
                : ["Ver"]
            }
            onAction={(action, idx) => {
              const lead = filtered[idx];
              if (!lead) return;
              if (action === "Ver" || action === "Editar") {
                if (action === "Editar" && !permissions.canEditAllProperties) {
                  toast.push("Sem permissão para editar", "error");
                  return;
                }
                setMode("edit");
                setEditingId(lead.id);
                setDrawerOpen(true);
              }
              if (action === "Eliminar") {
                if (!permissions.canEditAllProperties) {
                  toast.push("Sem permissão para eliminar", "error");
                  return;
                }
                handleDelete(lead.id);
              }
            }}
          />
          {filtered.length === 0 && !loading && (
            <div className="py-8 text-center text-sm text-[#C5C5C5]">
              {search || statusFilter !== "all" ? "Nenhuma lead encontrada" : "Nenhuma lead disponível"}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-[#C5C5C5]">
        Total: {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
        {(search || statusFilter !== "all") && filtered.length !== items.length && ` (filtrado de ${items.length})`}
      </p>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={mode === "create" ? "Nova Lead" : "Editar Lead"}
      >
        <LeadForm
          mode={mode}
          lead={current}
          onSubmit={handleSubmit}
          onCancel={() => setDrawerOpen(false)}
          saving={saving}
          canEditAll={permissions.canEditAllProperties}
        />
      </Drawer>
    </>
  );
}
