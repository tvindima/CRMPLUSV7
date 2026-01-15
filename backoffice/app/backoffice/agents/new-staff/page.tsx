'use client';

import { useState, useEffect } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { compressAvatar, uploadStaffAvatar } from "@/lib/avatarUpload";

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarProcessing, setAvatarProcessing] = useState(false);
  
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
        // FIXED: Usar proxy route com tenant isolation
        const response = await fetch(`/api/agents?limit=50`);
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

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarSelect = async (file: File | null) => {
    if (!file) return;
    try {
      setAvatarProcessing(true);
      const compressed = await compressAvatar(file);
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch (error) {
      console.error("Erro ao preparar avatar:", error);
      toast?.push("Erro ao preparar avatar", "error");
    } finally {
      setAvatarProcessing(false);
    }
  };

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

      if (avatarFile && result.user_id) {
        try {
          await uploadStaffAvatar(result.user_id, avatarFile);
        } catch (error) {
          console.error("Erro ao fazer upload do avatar:", error);
          toast?.push("Staff criado, mas avatar não foi carregado.", "error");
        }
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
          {/* Foto de Perfil */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Foto de Perfil</h2>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-full border border-[#2A2A2E] bg-[#151518]">
                <img
                  src={
                    avatarPreview ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || 'Staff')}&background=0047AB&color=fff&size=256`
                  }
                  alt="Avatar do staff"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={avatarProcessing}
                  onChange={(e) => handleAvatarSelect(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-[#C5C5C5] file:mr-4 file:rounded file:border-0 file:bg-[#1F1F22] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#2A2A2E]"
                />
                <p className="text-xs text-[#666]">
                  A imagem é redimensionada para 512x512px e comprimida para não pesar.
                </p>
                {avatarProcessing && (
                  <p className="text-xs text-[#0047AB]">A preparar avatar...</p>
                )}
              </div>
            </div>
          </div>

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
