'use client';

import { useState, useEffect } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";

type Agent = {
  id: number;
  name: string;
};

export default function NewStaffPage() {
  return (
    <ToastProvider>
      <NewStaffForm />
    </ToastProvider>
  );
}

function NewStaffForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'assistant',
    works_for_agent_id: '',
    password: ''
  });

  // Carregar lista de agentes
  useEffect(() => {
    async function loadAgents() {
      try {
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/agents/?limit=50`, {
          headers,
        });
        if (!response.ok) throw new Error('Erro ao carregar agentes');
        
        const data = await response.json();
        const agentList = data
          .filter((a: any) => a.name !== "Imóveis Mais Leiria")
          .map((a: any) => ({ id: a.id, name: a.name }))
          .sort((a: Agent, b: Agent) => a.name.localeCompare(b.name, 'pt-PT'));
        
        setAgents(agentList);
      } catch (error) {
        console.error("Erro ao carregar agentes:", error);
      } finally {
        setLoadingAgents(false);
      }
    }
    loadAgents();
  }, []);

  // Gerar password aleatória
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const symbols = '!@#$%';
    let password = 'CRM';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    setFormData(prev => ({ ...prev, password }));
  };

  // Gerar password ao carregar
  useEffect(() => {
    generatePassword();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password) {
      toast?.push("Preencha todos os campos obrigatórios", "error");
      return;
    }

    if (!formData.works_for_agent_id) {
      toast?.push("Selecione o agente responsável", "error");
      return;
    }

    setLoading(true);
    
    try {
      // Usar API route local que adiciona autenticação
      const response = await fetch('/api/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          full_name: formData.full_name,
          phone: formData.phone || null,
          password: formData.password,
          role: formData.role,
          works_for_agent_id: parseInt(formData.works_for_agent_id)
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Erro ao criar staff');
      }
      
      toast?.push(`Staff criado com sucesso! Password: ${formData.password}`, "success");
      
      // Mostrar modal com credenciais
      alert(`✅ Staff criado com sucesso!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nGuarde estas credenciais!`);
      
      // Redirecionar
      setTimeout(() => {
        window.location.href = '/backoffice/agents';
      }, 1500);
      
    } catch (error: any) {
      console.error("Erro ao criar staff:", error);
      toast?.push(error.message || "Erro ao criar staff", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackofficeLayout title="Novo Membro de Staff">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dados Pessoais</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#C5C5C5] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                  placeholder="Ex: Ana Sofia Carreira"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                  placeholder="email@imoveismais.pt"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                  placeholder="912345678"
                />
              </div>
            </div>
          </div>

          {/* Função */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Função</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Cargo *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                >
                  <option value="assistant">Assistente</option>
                  <option value="coordinator">Coordenador</option>
                  <option value="staff">Staff Geral</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Trabalha para *</label>
                <select
                  value={formData.works_for_agent_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, works_for_agent_id: e.target.value }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                  required
                >
                  <option value="">Selecionar agente...</option>
                  {loadingAgents ? (
                    <option disabled>A carregar...</option>
                  ) : (
                    agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Credenciais */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Credenciais de Acesso</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Password *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="flex-1 rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB] font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="rounded border border-[#0047AB] px-4 py-2 text-sm font-medium text-[#0047AB] hover:bg-[#0047AB]/10 transition-colors"
                  >
                    Gerar Nova
                  </button>
                </div>
                <p className="text-xs text-[#C5C5C5] mt-1">
                  Esta password será usada para login na app mobile
                </p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => window.location.href = '/backoffice/agents'}
              className="rounded border border-[#2A2A2E] px-6 py-2 text-sm font-medium text-white hover:bg-[#2A2A2E] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[#0047AB] px-6 py-2 text-sm font-medium text-white hover:bg-[#003380] transition-colors disabled:opacity-50"
            >
              {loading ? 'A criar...' : 'Criar Staff'}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
