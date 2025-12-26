'use client';

import { useState, useEffect } from 'react';
import { BackofficeLayout } from '@/backoffice/components/BackofficeLayout';
import { ToastProvider, useToast } from '@/backoffice/components/ToastProvider';

interface AgentFormData {
  name: string;
  email: string;
  phone: string;
  tax_id: string;
  address: string;
  role: 'agent' | 'team_leader' | 'manager' | 'admin';
  team_leader_id: number | null;
  license_number: string;
  hire_date: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  video_url: string;
  emergency_contact: string;
  is_active: boolean;
  can_receive_leads: boolean;
  max_properties: number | null;
  commission_rate: number | null;
  employee_type: 'comercial' | 'staff';
  staff_position: string;
  team_id: number | null;
  contract_type: 'permanent' | 'temporary' | 'freelance' | 'internship';
  contract_start: string;
  contract_end: string | null;
  contract_renewal_alert_days: number;
  // Documentos
  id_document?: File | null;
  contract_document?: File | null;
  certifications?: File[];
  cv_document?: File | null;
}

export default function NewAgentPage() {
  return (
    <ToastProvider>
      <NewAgentInner />
    </ToastProvider>
  );
}

function NewAgentInner() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Array<{ id: number; name: string }>>([]);
  const [documents, setDocuments] = useState({
    id_document: null as File | null,
    contract_document: null as File | null,
    certifications: [] as File[],
    cv_document: null as File | null,
  });
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    email: '',
    phone: '',
    tax_id: '',
    address: '',
    role: 'agent',
    team_leader_id: null,
    license_number: '',
    hire_date: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    video_url: '',
    emergency_contact: '',
    is_active: true,
    can_receive_leads: true,
    max_properties: 50,
    commission_rate: 3.5,
    employee_type: 'comercial',
    staff_position: '',
    team_id: null,
    contract_type: 'permanent',
    contract_start: '',
    contract_end: null,
    contract_renewal_alert_days: 60,
  });

  useEffect(() => {
    async function loadAgents() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/agents/?limit=100`
        );
        if (!response.ok) return;
        const data = await response.json();
        setAgents(data.filter((a: any) => a.name !== 'Imóveis Mais Leiria'));
      } catch (error) {
        console.error('Erro ao carregar agentes:', error);
      }
    }
    loadAgents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast?.push('Preencha os campos obrigatórios', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Mapear campos do formulário para o schema do backend
      const agentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        license_ami: formData.license_number || null,
        bio: null,
        instagram: formData.instagram_url || null,
        facebook: formData.facebook_url || null,
        linkedin: formData.linkedin_url || null,
        whatsapp: formData.phone || null,
        team_id: formData.team_id || null,
        agency_id: null,
      };
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/agents/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro ao criar agente');
      }

      toast?.push('Agente criado com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = '/backoffice/agents';
      }, 1500);
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast?.push(error instanceof Error ? error.message : 'Erro ao criar agente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackofficeLayout title="Novo Agente">
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-4 md:space-y-6 pb-8">
        {/* Dados Básicos */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Dados Básicos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                Nome Completo <span className="text-[#E10600]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="Tiago Vindima"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                Email <span className="text-[#E10600]">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="tiago@imoveismais.pt"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                Telefone <span className="text-[#E10600]">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="+351 912 345 678"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">NIF</label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="123456789"
              />
            </div>
          </div>

          <div className="mt-3 md:mt-4">
            <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Morada</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              placeholder="Rua Example, 123, Leiria"
            />
          </div>
        </section>

        {/* Tipo de RH */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Tipo de Recursos Humanos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                Tipo de RH <span className="text-[#E10600]">*</span>
              </label>
              <select
                value={formData.employee_type}
                onChange={(e) => setFormData({ ...formData, employee_type: e.target.value as any })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="comercial">RH Comercial</option>
                <option value="staff">RH Staff</option>
              </select>
            </div>

            {formData.employee_type === 'comercial' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Pertence à Equipa de</label>
                <select
                  value={formData.team_id || ''}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                >
                  <option value="">Selecionar agente...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.employee_type === 'staff' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Responsável</label>
                  <select
                    value={formData.team_leader_id || ''}
                    onChange={(e) => setFormData({ ...formData, team_leader_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                  >
                    <option value="">Staff de Loja (sem responsável direto)</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                    Cargo <span className="text-[#E10600]">*</span>
                  </label>
                  <select
                    value={formData.staff_position}
                    onChange={(e) => setFormData({ ...formData, staff_position: e.target.value })}
                    className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                  >
                    <option value="">Selecionar cargo...</option>
                    <option value="Rececionista">Rececionista</option>
                    <option value="Assistente Administrativo">Assistente Administrativo</option>
                    <option value="Coordenador Administrativo">Coordenador Administrativo</option>
                    <option value="Gestor de Marketing">Gestor de Marketing</option>
                    <option value="Designer Gráfico">Designer Gráfico</option>
                    <option value="Fotógrafo">Fotógrafo</option>
                    <option value="Técnico de IT">Técnico de IT</option>
                    <option value="Contabilista">Contabilista</option>
                    <option value="Jurista">Jurista</option>
                    <option value="Facility Manager">Facility Manager</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Dados de Contrato */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Dados de Contrato</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                Tipo de Contrato <span className="text-[#E10600]">*</span>
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="permanent">Contrato Permanente (Sem Termo)</option>
                <option value="temporary">Contrato a Termo Certo</option>
                <option value="freelance">Prestador de Serviços / Freelancer</option>
                <option value="internship">Estágio Profissional</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                Data de Início <span className="text-[#E10600]">*</span>
              </label>
              <input
                type="date"
                value={formData.contract_start}
                onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                required
              />
            </div>

            {formData.contract_type !== 'permanent' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                    Data de Fim <span className="text-[#E10600]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.contract_end || ''}
                    onChange={(e) => setFormData({ ...formData, contract_end: e.target.value || null })}
                    className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">
                    Alerta de Renovação (dias antes)
                  </label>
                  <input
                    type="number"
                    value={formData.contract_renewal_alert_days}
                    onChange={(e) => setFormData({ ...formData, contract_renewal_alert_days: Number(e.target.value) })}
                    className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                    placeholder="60"
                    min="1"
                    max="365"
                  />
                  <p className="mt-1 text-xs text-[#888]">
                    Alerta {formData.contract_renewal_alert_days} dias antes do fim
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Documentos */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Documentos</h2>

          <div className="space-y-4">
            <div className="rounded border-2 border-dashed border-[#2A2A2E] p-4 hover:border-[#E10600] transition-colors">
              <label className="block text-sm font-medium text-white mb-2">
                📄 Documento de Identificação (CC / Passaporte)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocuments({ ...documents, id_document: e.target.files?.[0] || null })}
                className="w-full text-sm text-[#C5C5C5] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#E10600] file:text-white hover:file:bg-[#C10500] file:cursor-pointer"
              />
              <p className="text-xs text-[#888] mt-1">PDF, JPG ou PNG - máx 5MB</p>
              {documents.id_document && (
                <p className="text-xs text-[#00FF00] mt-1">✓ {documents.id_document.name}</p>
              )}
            </div>

            <div className="rounded border-2 border-dashed border-[#2A2A2E] p-4 hover:border-[#E10600] transition-colors">
              <label className="block text-sm font-medium text-white mb-2">
                📝 Contrato de Trabalho / Prestação de Serviços
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setDocuments({ ...documents, contract_document: e.target.files?.[0] || null })}
                className="w-full text-sm text-[#C5C5C5] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#E10600] file:text-white hover:file:bg-[#C10500] file:cursor-pointer"
              />
              <p className="text-xs text-[#888] mt-1">PDF - máx 10MB</p>
              {documents.contract_document && (
                <p className="text-xs text-[#00FF00] mt-1">✓ {documents.contract_document.name}</p>
              )}
            </div>

            {formData.employee_type === 'comercial' && (
              <div className="rounded border-2 border-dashed border-[#2A2A2E] p-4 hover:border-[#E10600] transition-colors">
                <label className="block text-sm font-medium text-white mb-2">
                  🎓 Certificações (AMI, Formações Profissionais)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocuments({ ...documents, certifications: Array.from(e.target.files || []) })}
                  className="w-full text-sm text-[#C5C5C5] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#E10600] file:text-white hover:file:bg-[#C10500] file:cursor-pointer"
                />
                <p className="text-xs text-[#888] mt-1">Múltiplos ficheiros permitidos - PDF, JPG ou PNG</p>
                {documents.certifications.length > 0 && (
                  <p className="text-xs text-[#00FF00] mt-1">✓ {documents.certifications.length} ficheiro(s) selecionado(s)</p>
                )}
              </div>
            )}

            <div className="rounded border-2 border-dashed border-[#2A2A2E] p-4 hover:border-[#E10600] transition-colors">
              <label className="block text-sm font-medium text-white mb-2">
                📋 Curriculum Vitae (CV)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setDocuments({ ...documents, cv_document: e.target.files?.[0] || null })}
                className="w-full text-sm text-[#C5C5C5] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#E10600] file:text-white hover:file:bg-[#C10500] file:cursor-pointer"
              />
              <p className="text-xs text-[#888] mt-1">PDF ou Word - máx 5MB</p>
              {documents.cv_document && (
                <p className="text-xs text-[#00FF00] mt-1">✓ {documents.cv_document.name}</p>
              )}
            </div>
          </div>
        </section>

        {/*     </div>
              </>
            )}
          </div>
        </section>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 sticky bottom-0 bg-[#070708] py-4 border-t border-[#1F1F22]">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded bg-[#E10600] px-6 py-3 font-medium text-white transition-colors hover:bg-[#C10500] disabled:opacity-50"
          >
            {loading ? 'A guardar...' : 'Guardar Agente'}
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/backoffice/agents'}
            className="w-full sm:w-auto rounded bg-[#2A2A2E] px-6 py-3 font-medium text-white transition-colors hover:bg-[#3A3A3E]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </BackofficeLayout>
  );
}
