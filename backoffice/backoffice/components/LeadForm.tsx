'use client';

import { FormEvent, useEffect, useState } from "react";
import { BackofficeLead, BackofficeLeadPayload, BackofficeAgent, getBackofficeAgents, LeadStatus } from "../../src/services/backofficeApi";

export type LeadFormSubmit = {
  payload: BackofficeLeadPayload;
};

type Props = {
  initial?: Partial<BackofficeLead>;
  onSubmit: (data: LeadFormSubmit) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
};

export function LeadForm({ initial, onSubmit, onCancel, saving }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [origin, setOrigin] = useState(initial?.origin || "");
  const [status, setStatus] = useState<LeadStatus>(initial?.status || "new");
  const [assignedAgentId, setAssignedAgentId] = useState(initial?.assigned_agent_id?.toString() || "");
  const [errors, setErrors] = useState<string[]>([]);
  const [agents, setAgents] = useState<BackofficeAgent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    const loadAgents = async () => {
      setLoadingAgents(true);
      try {
        const data = await getBackofficeAgents({ limit: 100 });
        setAgents(data);
      } catch (error) {
        console.error("Failed to load agents:", error);
        setAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };
    loadAgents();
  }, []);

  useEffect(() => {
    setName(initial?.name || "");
    setEmail(initial?.email || "");
    setPhone(initial?.phone || "");
    setOrigin(initial?.origin || "");
    setStatus(initial?.status || "new");
    setAssignedAgentId(initial?.assigned_agent_id?.toString() || "");
    setErrors([]);
  }, [initial]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name) errs.push("Nome é obrigatório");
    if (!email) errs.push("Email é obrigatório");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) errs.push("Email inválido");

    setErrors(errs);
    if (errs.length) return;

    const payload: BackofficeLeadPayload = {
      name,
      email,
      phone: phone || null,
      origin: origin || null,
      status,
      assigned_agent_id: assignedAgentId ? Number(assignedAgentId) : null,
    };

    onSubmit({ payload });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {errors.length > 0 && (
        <div className="rounded bg-red-900/20 p-3 text-sm text-red-400">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo *"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email *"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="">Origem (escolher)</option>
          <option value="website">Website</option>
          <option value="portal">Portal</option>
          <option value="referral">Referência</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="google">Google Ads</option>
          <option value="phone">Telefone</option>
          <option value="email">Email</option>
          <option value="walk-in">Walk-in</option>
          <option value="other">Outro</option>
        </select>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus)}
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="new">Nova</option>
          <option value="contacted">Contactada</option>
          <option value="qualified">Qualificada</option>
          <option value="lost">Perdida</option>
        </select>
        <select
          value={assignedAgentId}
          onChange={(e) => setAssignedAgentId(e.target.value)}
          disabled={loadingAgents}
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600] disabled:opacity-50"
        >
          <option value="">
            {loadingAgents ? "A carregar agentes..." : "Agente atribuído (opcional)"}
          </option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} {agent.email ? `(${agent.email})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#2A2A2E] pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded px-4 py-2 text-sm text-[#C5C5C5] hover:text-white disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-[#E10600] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff4d7a] disabled:opacity-50"
        >
          {saving ? "A guardar..." : initial?.id ? "Atualizar" : "Criar Lead"}
        </button>
      </div>
    </form>
  );
}
