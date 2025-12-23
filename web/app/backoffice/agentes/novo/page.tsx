'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "../../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";

const ROLES = [
  { value: "agent", label: "Agente", description: "Consultor imobiliário" },
  { value: "staff", label: "Staff", description: "Equipa de backoffice" },
  { value: "admin", label: "Administrador", description: "Acesso total ao sistema" },
];

const DEPARTMENTS = [
  { value: "comercial", label: "Comercial" },
  { value: "backoffice", label: "BackOffice" },
  { value: "marketing", label: "Marketing" },
  { value: "financeiro", label: "Financeiro / RH" },
  { value: "direcao", label: "Direção" },
];

function NovoAgenteForm() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "agent",
    department: "comercial",
    password: "Sucesso2025!",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email) {
      toast.push("Por favor preencha nome e email", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("bo_token");
      
      // Usar endpoint de admin para criar utilizador
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app'}/admin/users/create?email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(form.name)}&role=${form.role}&password=${encodeURIComponent(form.password)}&phone=${encodeURIComponent(form.phone || '')}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao criar utilizador");
      }

      const data = await response.json();
      toast.push(`✅ ${data.user.name} criado com sucesso!`, "success");
      
      // Redirecionar para lista de agentes
      setTimeout(() => {
        router.push("/backoffice/agentes");
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao criar utilizador:", error);
      toast.push(error.message || "Erro ao criar utilizador", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackofficeLayout title="Novo Membro de Equipa">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F1F22] text-white hover:bg-[#2A2A2E]"
          >
            ←
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">Adicionar Colaborador</h2>
            <p className="text-sm text-[#C5C5C5]">Crie um novo membro da equipa</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#888]">
              Dados Pessoais
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#C5C5C5]">Nome completo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Ana Coordenadora"
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#151518] px-4 py-3 text-white outline-none focus:border-[#E10600]"
                  required
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm text-[#C5C5C5]">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Ex: colaborador@imoveismais.pt"
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#151518] px-4 py-3 text-white outline-none focus:border-[#E10600]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#C5C5C5]">Telefone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ex: 912345678"
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#151518] px-4 py-3 text-white outline-none focus:border-[#E10600]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#C5C5C5]">Password inicial</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#151518] px-4 py-3 text-white outline-none focus:border-[#E10600]"
                />
                <p className="mt-1 text-xs text-[#666]">O utilizador pode alterar depois</p>
              </div>
            </div>
          </div>

          {/* Função / Role */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#888]">
              Função na Empresa
            </h3>
            
            <div className="grid gap-3">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all ${
                    form.role === r.value
                      ? "border-[#E10600] bg-[#E10600]/10"
                      : "border-[#2A2A2E] hover:border-[#444]"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="accent-[#E10600]"
                  />
                  <div>
                    <p className="font-medium text-white">{r.label}</p>
                    <p className="text-sm text-[#888]">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Departamento */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[#888]">
              Departamento
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm({ ...form, department: d.value })}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    form.department === d.value
                      ? "bg-[#E10600] text-white"
                      : "bg-[#1F1F22] text-[#C5C5C5] hover:bg-[#2A2A2E]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-[#2A2A2E] bg-transparent py-3 text-white hover:bg-[#1F1F22]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#E10600] to-[#BD0C0C] py-3 font-medium text-white hover:from-[#BD0C0C] hover:to-[#A30808] disabled:opacity-50"
            >
              {loading ? "A criar..." : "Criar Colaborador"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}

export default function NovoAgentePage() {
  return (
    <ToastProvider>
      <NovoAgenteForm />
    </ToastProvider>
  );
}
