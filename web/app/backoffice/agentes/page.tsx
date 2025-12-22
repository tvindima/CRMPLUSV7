'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BackofficeLayout } from "../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";

type AgentItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  team?: string | null;
  status?: string | null;
  avatar?: string | null;
};

// Mock mínimo enquanto não houver endpoint real
const mockAgents: AgentItem[] = [
  { id: 1, name: "Nuno Faria", email: "nfaria@imoveismais.pt", phone: "914039335", status: "Ativo", avatar: "/avatars/nuno-faria.png" },
  { id: 2, name: "Pedro Olaio", email: "polaio@imoveismais.pt", phone: "915213221", status: "Ativo", avatar: "/avatars/pedro-olaio.png" },
  { id: 3, name: "João Silva", email: "91404@imoveismais.pt", phone: "91408335", status: "Ativo", avatar: "/avatars/joao-silva.png" },
  { id: 4, name: "Fabio Passos", email: "jofar@imoveismais.pt", phone: "913331811", status: "Ativo", avatar: "/avatars/fabio-passos.png" },
];

function AgentRow({ agent }: { agent: AgentItem }) {
  return (
    <div className="grid grid-cols-[80px_1.2fr_1.2fr_1fr_0.6fr_0.6fr] items-center border-b border-[#1F1F22] px-3 py-3 text-sm text-white">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#0B0B0D]">
          {agent.avatar ? (
            <Image src={agent.avatar} alt={agent.name} width={40} height={40} className="h-10 w-10 object-cover" />
          ) : (
            <span className="text-xs text-[#C5C5C5]">{agent.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <span className="font-medium">{agent.name}</span>
      </div>
      <span className="text-[#C5C5C5]">{agent.email}</span>
      <span className="text-[#C5C5C5]">{agent.phone || "—"}</span>
      <span className="text-[#C5C5C5]">{agent.status || "—"}</span>
      <span className="text-[#C5C5C5]">—</span>
      <div className="flex gap-4 text-xs">
        <button className="text-white underline">Editar</button>
        <button className="text-[#E10600] underline">Desactivar</button>
      </div>
    </div>
  );
}

export default function AgentesPage() {
  return (
    <ToastProvider>
      <AgentesInner />
    </ToastProvider>
  );
}

function AgentesInner() {
  const toast = useToast();
  const [items, setItems] = useState<AgentItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // TODO: substituir mockAgents pelo endpoint real de agentes quando disponível
    setItems(mockAgents);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  return (
    <BackofficeLayout title="Agentes">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar"
          className="w-full max-w-xs rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]">
          <option>Estado</option>
        </select>
        <select className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]">
          <option>Tipo</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
        <div className="grid grid-cols-[80px_1.2fr_1.2fr_1fr_0.6fr_0.6fr] items-center border-b border-[#1F1F22] px-3 py-3 text-xs uppercase tracking-wide text-[#C5C5C5]">
          <span>Foto</span>
          <span>Nome</span>
          <span>Email</span>
          <span>Contacto</span>
          <span>Tipo</span>
          <span className="text-right">Opções</span>
        </div>
        {filtered.map((agent) => (
          <AgentRow key={agent.id} agent={agent} />
        ))}
      </div>

      <p className="mt-2 text-xs text-[#C5C5C5]">TODO: ligar aos endpoints reais de agentes e fotos quando estiverem disponíveis.</p>
    </BackofficeLayout>
  );
}
