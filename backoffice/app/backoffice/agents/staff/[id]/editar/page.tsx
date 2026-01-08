'use client';

import { useState, useEffect, use } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../../../backoffice/components/ToastProvider";
import { useRole } from "../../../../../../backoffice/context/roleContext";

type Agent = {
  id: number;
  name: string;
};

type StaffData = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  works_for_agent_id: number | null;
  is_active: boolean;
};

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ToastProvider>
      <EditStaffInner staffId={resolvedParams.id} />
    </ToastProvider>
  );
}

function EditStaffInner({ staffId }: { staffId: string }) {
  const toast = useToast();
  const { role: currentUserRole } = useRole();
  const isAdmin = currentUserRole === 'admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [formData, setFormData] = useState<StaffData>({
    id: 0,
    email: '',
    full_name: '',
    phone: '',
    role: 'assistant',
    works_for_agent_id: null,
    is_active: true
  });

  // Carregar dados do staff
  useEffect(() => {
    async function loadStaff() {
      try {
        const response = await fetch(`/api/staff/${staffId}`);
        if (!response.ok) throw new Error('Erro ao carregar staff');
        
        const data = await response.json();
        setFormData({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone || '',
          role: data.role,
          works_for_agent_id: data.works_for_agent_id,
          is_active: data.is_active
        });
      } catch (error) {
        console.error("Erro ao carregar staff:", error);
        toast?.push("Erro ao carregar dados do staff", "error");
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, [staffId, toast]);

  // Carregar lista de agentes
  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch(`/api/agents`);
        if (!response.ok) throw new Error('Erro ao carregar agentes');
        
        const data = await response.json();
        const agentList = data
          .map((a: any) => ({ id: a.id, name: a.name }))
          .sort((a: Agent, b: Agent) => a.name.localeCompare(b.name, 'pt-PT'));
        
        setAgents(agentList);
      } catch (error) {
        console.error("Erro ao carregar agentes:", error);
      }
    }
    loadAgents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email) {
      toast?.push("Preencha todos os campos obrigatórios", "error");
      return;
    }

    setSaving(true);
    
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: formData.role,
          works_for_agent_id: formData.works_for_agent_id
        })
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || 'Erro ao atualizar staff');
      }
      
      toast?.push("Staff atualizado com sucesso!", "success");
      
      setTimeout(() => {
        window.location.href = '/backoffice/agents';
      }, 1000);
      
    } catch (error: any) {
      console.error("Erro ao atualizar staff:", error);
      toast?.push(error.message || "Erro ao atualizar staff", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast?.push("Password deve ter pelo menos 6 caracteres", "error");
      return;
    }

    setSavingPassword(true);
    
    try {
      const response = await fetch(`/api/staff/${staffId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail || 'Erro ao alterar password');
      }
      
      toast?.push("Password alterada com sucesso!", "success");
      setShowPasswordModal(false);
      setNewPassword('');
      
    } catch (error: any) {
      console.error("Erro ao alterar password:", error);
      toast?.push(error.message || "Erro ao alterar password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const symbols = '!@#$%';
    let password = 'CRM';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    setNewPassword(password);
  };

  if (loading) {
    return (
      <BackofficeLayout title="Editar Staff">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#C5C5C5]">A carregar...</div>
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout title={`Editar ${formData.full_name}`}>
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
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-[#666] outline-none cursor-not-allowed"
                />
                <p className="text-xs text-[#666] mt-1">Email não pode ser alterado</p>
              </div>
              
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                />
              </div>
            </div>
          </div>

          {/* Função */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Função</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">
                  Cargo/Permissões *
                  {!isAdmin && <span className="text-xs text-[#666] ml-2">(apenas admin pode alterar)</span>}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  disabled={!isAdmin}
                  className={`w-full rounded border border-[#2A2A2E] px-3 py-2 outline-none ${
                    isAdmin 
                      ? 'bg-[#151518] text-white focus:border-[#0047AB]' 
                      : 'bg-[#0B0B0D] text-[#666] cursor-not-allowed'
                  }`}
                >
                  <option value="assistant">Assistente</option>
                  <option value="coordinator">Coordenador</option>
                  <option value="staff">Staff</option>
                  <option value="leader">Líder de Equipa</option>
                  <option value="agent">Agente</option>
                  <option value="admin">Administrador</option>
                </select>
                {isAdmin && (
                  <p className="text-xs text-[#666] mt-1">
                    Define as permissões de acesso do utilizador
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-[#C5C5C5] mb-1">Trabalha para</label>
                <select
                  value={formData.works_for_agent_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, works_for_agent_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                >
                  <option value="">Nenhum</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Segurança</h2>
            
            <button
              type="button"
              onClick={() => {
                generatePassword();
                setShowPasswordModal(true);
              }}
              className="rounded bg-[#E10600] px-4 py-2 text-sm font-medium text-white hover:bg-[#C10500] transition-colors"
            >
              Alterar Password
            </button>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => window.location.href = '/backoffice/agents'}
              className="rounded border border-[#2A2A2E] px-6 py-2 text-sm font-medium text-white hover:bg-[#1F1F22] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#0047AB] px-6 py-2 text-sm font-medium text-white hover:bg-[#003d91] transition-colors disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0F0F10] rounded-2xl border border-[#1F1F22] p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Alterar Password</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-[#C5C5C5] mb-1">Nova Password</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-white outline-none focus:border-[#0047AB]"
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="rounded border border-[#0047AB] px-3 py-2 text-sm text-[#0047AB] hover:bg-[#0047AB]/10 transition-colors"
                >
                  Gerar
                </button>
              </div>
              <p className="text-xs text-[#666] mt-1">Mínimo 6 caracteres</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
                className="rounded border border-[#2A2A2E] px-4 py-2 text-sm text-white hover:bg-[#1F1F22] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={savingPassword}
                className="rounded bg-[#E10600] px-4 py-2 text-sm font-medium text-white hover:bg-[#C10500] transition-colors disabled:opacity-50"
              >
                {savingPassword ? 'A guardar...' : 'Alterar Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}
