'use client';

import { useState, useEffect } from "react";
import { BackofficeTeam, BackofficeAgent, getBackofficeAgents } from "../../src/services/backofficeApi";

type TeamFormProps = {
  team?: BackofficeTeam | null;
  onSubmit: (data: { name: string; description?: string | null; manager_id?: number | null }) => Promise<void>;
  onCancel: () => void;
};

export function TeamForm({ team, onSubmit, onCancel }: TeamFormProps) {
  const [name, setName] = useState(team?.name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [managerId, setManagerId] = useState<number | null>(team?.manager_id || null);
  const [agents, setAgents] = useState<BackofficeAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getBackofficeAgents({ limit: 100 })
      .then((data) => setAgents(data))
      .catch((err) => console.error("Erro ao carregar agentes:", err))
      .finally(() => setAgentsLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome da equipa é obrigatório");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        manager_id: managerId || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao guardar equipa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Nome da Equipa *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#6B7280] focus:border-[#5fa2ff] focus:outline-none focus:ring-2 focus:ring-[#5fa2ff]/25"
          placeholder="Ex: Equipa Lisboa Centro"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
          Descrição
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#6B7280] focus:border-[#5fa2ff] focus:outline-none focus:ring-2 focus:ring-[#5fa2ff]/25"
          placeholder="Descrição opcional da equipa"
        />
      </div>

      <div>
        <label htmlFor="manager" className="block text-sm font-medium text-white mb-2">
          Gestor da Equipa
        </label>
        {agentsLoading ? (
          <div className="text-sm text-[#6B7280]">A carregar agentes...</div>
        ) : (
          <select
            id="manager"
            value={managerId || ""}
            onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-white/10 bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#5fa2ff] focus:outline-none focus:ring-2 focus:ring-[#5fa2ff]/25"
          >
            <option value="">Sem gestor atribuído</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-gradient-to-br from-[#0f5afc] to-[#4bc2ff] px-4 py-2.5 font-medium text-white shadow-[0_10px_30px_rgba(79,139,255,0.4)] transition hover:shadow-[0_15px_40px_rgba(79,139,255,0.5)] disabled:opacity-50"
        >
          {loading ? "A guardar..." : team ? "Atualizar Equipa" : "Criar Equipa"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-[#0F0F12] px-4 py-2.5 font-medium text-white transition hover:bg-[#1a1a20] disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
