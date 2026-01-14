'use client';

import { useRole } from "../context/roleContext";

const roleLabels: Record<string, string> = {
  guest: "Convidado",
  agent: "Agente",
  leader: "Líder",
  admin: "Admin",
  staff: "Staff",
};

export function Topbar() {
  const { role, setRole, isAuthenticated } = useRole();

  // Apenas admin e staff podem alterar role (para testes/debug)
  const canChangeRole = role === 'admin' || role === 'staff';

  if (!isAuthenticated) {
    return (
      <header className="flex items-center justify-end border-b border-[#1F1F22] bg-[#0F0F10] px-6 py-3">
        <p className="text-sm text-[#C5C5C5]">Sessão não autenticada</p>
      </header>
    );
  }
  return (
    <header className="flex items-center justify-end border-b border-[#1F1F22] bg-[#0F0F10] px-6 py-3">
      <div>
        <p className="text-sm text-[#C5C5C5]">Role: {roleLabels[role]}</p>
      </div>
      {canChangeRole && (
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="ml-3 rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="agent">Agente</option>
          <option value="leader">Líder</option>
          <option value="admin">Admin</option>
        </select>
      )}
    </header>
  );
}
