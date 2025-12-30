'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";

type AgentItem = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  team?: string | null;
  status?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  employee_type?: 'comercial' | 'staff';
};

type StaffItem = {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  works_for_agent_id?: number | null;
  works_for_agent_name?: string | null;
  is_active: boolean;
};

function AgentRow({ agent }: { agent: AgentItem }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = imgError 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=E10600&color=fff&size=96`
    : agent.avatar_url || agent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=E10600&color=fff&size=96`;
  
  return (
    <div className="grid grid-cols-[60px_1fr_auto] md:grid-cols-[80px_1.2fr_1.2fr_1fr_0.6fr_0.6fr] items-center gap-2 md:gap-0 border-b border-[#1F1F22] px-3 py-3 text-sm text-white">
      {/* Avatar */}
      <div className="flex items-center justify-center">
        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center overflow-hidden rounded-full bg-[#0B0B0D] flex-shrink-0">
          <Image 
            src={avatarUrl} 
            alt={agent.name} 
            width={48} 
            height={48} 
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        </div>
      </div>
      
      {/* Nome - mobile inclui email */}
      <div className="flex flex-col md:block">
        <span className="font-medium">{agent.name}</span>
        <span className="text-xs text-[#C5C5C5] md:hidden">{agent.email}</span>
      </div>
      
      {/* Email - apenas desktop */}
      <span className="hidden md:block text-[#C5C5C5]">{agent.email}</span>
      
      {/* Contacto - apenas desktop */}
      <span className="hidden md:block text-[#C5C5C5]">{agent.phone || "—"}</span>
      
      {/* Tipo - apenas desktop */}
      <span className="hidden md:block text-[#C5C5C5]">{agent.employee_type === 'staff' ? 'Staff' : 'Comercial'}</span>
      
      {/* Botões de ação */}
      <div className="flex gap-2 md:gap-3 justify-end">
        <button 
          onClick={() => window.location.href = `/backoffice/agents/${agent.id}/editar`}
          className="rounded bg-[#E10600] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#C10500] transition-colors"
        >
          Editar
        </button>
        <button className="rounded border border-[#E10600] px-3 py-1.5 text-xs font-medium text-[#E10600] hover:bg-[#E10600]/10 transition-colors hidden md:block">
          Desactivar
        </button>
      </div>
    </div>
  );
}

function StaffRow({ staff, onDelete }: { staff: StaffItem; onDelete: (id: number) => void }) {
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.full_name)}&background=0047AB&color=fff&size=96`;
  
  const roleLabels: Record<string, string> = {
    'assistant': 'Assistente',
    'coordinator': 'Coordenador',
    'staff': 'Staff',
    'admin': 'Admin'
  };
  
  return (
    <div className="grid grid-cols-[60px_1fr_auto] md:grid-cols-[80px_1.2fr_1.2fr_1fr_1fr_0.6fr] items-center gap-2 md:gap-0 border-b border-[#1F1F22] px-3 py-3 text-sm text-white">
      {/* Avatar */}
      <div className="flex items-center justify-center">
        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center overflow-hidden rounded-full bg-[#0B0B0D] flex-shrink-0">
          <Image 
            src={avatarUrl} 
            alt={staff.full_name} 
            width={48} 
            height={48} 
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      </div>
      
      {/* Nome - mobile inclui email e cargo */}
      <div className="flex flex-col md:block">
        <span className="font-medium">{staff.full_name}</span>
        <span className="text-xs text-[#C5C5C5] md:hidden">{staff.email}</span>
        <span className="text-xs text-[#0047AB] md:hidden">{roleLabels[staff.role] || staff.role}</span>
      </div>
      
      {/* Email - apenas desktop */}
      <span className="hidden md:block text-[#C5C5C5]">{staff.email}</span>
      
      {/* Contacto - apenas desktop */}
      <span className="hidden md:block text-[#C5C5C5]">{staff.phone || "—"}</span>
      
      {/* Trabalha para - apenas desktop */}
      <span className="hidden md:block text-[#C5C5C5]">
        {staff.works_for_agent_name || "—"}
      </span>
      
      {/* Botões de ação */}
      <div className="flex gap-2 md:gap-3 justify-end">
        <button 
          onClick={() => onDelete(staff.id)}
          className="rounded border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-600/10 transition-colors"
        >
          Remover
        </button>
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
  const [staffItems, setStaffItems] = useState<StaffItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Carregar agentes
  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/agents/?limit=50`, {
          headers,
        });
        if (!response.ok) throw new Error('Erro ao carregar agentes');
        
        const data = await response.json();
        const agents = data
          .filter((a: any) => a.name !== "Imóveis Mais Leiria")
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            phone: a.phone,
            status: "Ativo",
            avatar_url: a.avatar_url,
            team: a.team,
            employee_type: a.employee_type || 'comercial'
          }))
          .sort((a: any, b: any) => {
            if (a.employee_type !== b.employee_type) {
              return a.employee_type === 'comercial' ? -1 : 1;
            }
            return a.name.localeCompare(b.name, 'pt-PT');
          });
        
        setItems(agents);
      } catch (error) {
        console.error("Erro ao carregar agentes:", error);
        toast?.push("Erro ao carregar agentes", "error");
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, [toast]);

  // Carregar staff
  useEffect(() => {
    async function loadStaff() {
      try {
        setLoadingStaff(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/admin/setup/list-staff`);
        if (!response.ok) throw new Error('Erro ao carregar staff');
        
        const data = await response.json();
        setStaffItems(data.staff || []);
      } catch (error) {
        console.error("Erro ao carregar staff:", error);
      } finally {
        setLoadingStaff(false);
      }
    }
    loadStaff();
  }, []);

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Tem a certeza que deseja remover este membro de staff?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/admin/setup/delete-user/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao remover staff');
      
      setStaffItems(prev => prev.filter(s => s.id !== id));
      toast?.push("Membro de staff removido", "success");
    } catch (error) {
      console.error("Erro ao remover staff:", error);
      toast?.push("Erro ao remover staff", "error");
    }
  };

  const filtered = useMemo(() => {
    return items.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const filteredStaff = useMemo(() => {
    if (!search) return staffItems;
    return staffItems.filter((s) => 
      s.full_name.toLowerCase().includes(search.toLowerCase()) || 
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [staffItems, search]);

  return (
    <BackofficeLayout title="Agentes">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar"
          className="w-full sm:w-auto sm:max-w-xs flex-1 sm:flex-initial rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select className="w-full sm:w-auto rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]">
          <option>Estado</option>
        </select>
        <select className="w-full sm:w-auto rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]">
          <option>Tipo</option>
        </select>
        <button
          onClick={() => window.location.href = '/backoffice/agents/new'}
          className="w-full sm:w-auto sm:ml-auto rounded bg-[#E10600] px-4 py-2 text-sm font-medium text-white hover:bg-[#C10500] transition-colors"
        >
          + Novo Agente
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
        {/* Header - visível apenas em desktop */}
        <div className="hidden md:grid grid-cols-[80px_1.2fr_1.2fr_1fr_0.6fr_0.6fr] items-center border-b border-[#1F1F22] px-3 py-3 text-xs uppercase tracking-wide text-[#C5C5C5]">
          <span>Foto</span>
          <span>Nome</span>
          <span>Email</span>
          <span>Contacto</span>
          <span>Tipo</span>
          <span className="text-right">Opções</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[#C5C5C5]">A carregar agentes...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[#C5C5C5]">Nenhum agente encontrado.</div>
        ) : (
          filtered.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))
        )}
      </div>

      <p className="mt-2 text-xs text-[#C5C5C5]">
        {loading ? "Carregando..." : `Total: ${filtered.length} agente${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {/* Secção de Staff */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Staff da Agência</h2>
          <button
            onClick={() => window.location.href = '/backoffice/agents/new-staff'}
            className="rounded bg-[#0047AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#003380] transition-colors"
          >
            + Novo Staff
          </button>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
          {/* Header Staff - visível apenas em desktop */}
          <div className="hidden md:grid grid-cols-[80px_1.2fr_1.2fr_1fr_1fr_0.6fr] items-center border-b border-[#1F1F22] px-3 py-3 text-xs uppercase tracking-wide text-[#C5C5C5]">
            <span>Foto</span>
            <span>Nome</span>
            <span>Email</span>
            <span>Contacto</span>
            <span>Trabalha para</span>
            <span className="text-right">Opções</span>
          </div>
          {loadingStaff ? (
            <div className="py-12 text-center text-[#C5C5C5]">A carregar staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-[#C5C5C5]">Nenhum membro de staff registado.</div>
          ) : (
            filteredStaff.map((staff) => (
              <StaffRow key={staff.id} staff={staff} onDelete={handleDeleteStaff} />
            ))
          )}
        </div>

        <p className="mt-2 text-xs text-[#C5C5C5]">
          {loadingStaff ? "Carregando..." : `Total: ${filteredStaff.length} membro${filteredStaff.length !== 1 ? 's' : ''} de staff`}
        </p>
      </div>
    </BackofficeLayout>
  );
}
