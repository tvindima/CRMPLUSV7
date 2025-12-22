'use client';

import { useState } from 'react';
import { BackofficeLayout } from '@/backoffice/components/BackofficeLayout';
import { ToastProvider, useToast } from '@/backoffice/components/ToastProvider';

interface LeadFormData {
  // Dados do Cliente
  name: string;
  email: string;
  phone: string;
  nif: string;
  
  // Critérios de Busca - Tipo de Imóvel
  property_types: string[]; // Apartamento, Moradia, Terreno, Loja, Armazém
  typology: string[]; // T0, T1, T2, T3, T4+
  
  // Critérios de Busca - Localização
  preferred_districts: string[]; // Leiria, Lisboa, Porto, etc
  preferred_councils: string[]; // Leiria, Marinha Grande, etc
  preferred_parishes: string[]; // Freguesias específicas
  
  // Critérios de Busca - Características
  min_area: number | null;
  max_area: number | null;
  min_bedrooms: number | null;
  max_bedrooms: number | null;
  min_bathrooms: number | null;
  garage: boolean | null; // true=obrigatório, false=não importante, null=indiferente
  garden: boolean | null;
  pool: boolean | null;
  elevator: boolean | null;
  balcony: boolean | null;
  
  // Critérios Financeiros
  min_price: number | null;
  max_price: number | null;
  financing_needed: boolean;
  max_financing_amount: number | null;
  
  // Urgência e Notas
  urgency: 'baixa' | 'media' | 'alta' | 'urgente';
  purpose: 'habitacao_propria' | 'investimento' | 'ferias' | 'arrendamento';
  notes: string;
  
  // Sistema
  agent_id: number | null;
  source: 'website' | 'telefone' | 'email' | 'presencial' | 'referencia' | 'outro';
}

export default function NewLeadPage() {
  return (
    <ToastProvider>
      <NewLeadInner />
    </ToastProvider>
  );
}

function NewLeadInner() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    nif: '',
    property_types: [],
    typology: [],
    preferred_districts: [],
    preferred_councils: [],
    preferred_parishes: [],
    min_area: null,
    max_area: null,
    min_bedrooms: null,
    max_bedrooms: null,
    min_bathrooms: null,
    garage: null,
    garden: null,
    pool: null,
    elevator: null,
    balcony: null,
    min_price: null,
    max_price: null,
    financing_needed: false,
    max_financing_amount: null,
    urgency: 'media',
    purpose: 'habitacao_propria',
    notes: '',
    agent_id: null,
    source: 'website',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast?.push('Preencha nome e telefone do cliente', 'error');
      return;
    }

    if (formData.property_types.length === 0) {
      toast?.push('Selecione pelo menos um tipo de imóvel', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://crmplusv7-production.up.railway.app'}/leads/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error('Erro ao criar lead');

      toast?.push('Lead criada com sucesso! Sistema irá notificar quando houver matches.', 'success');
      setTimeout(() => {
        window.location.href = '/backoffice/leads';
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast?.push('Erro ao criar lead', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayValue = (field: keyof LeadFormData, value: string) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    setFormData({ ...formData, [field]: newArray });
  };

  return (
    <BackofficeLayout title="Nova Lead - Cliente Comprador" showBackButton={true}>
      <form onSubmit={handleSubmit} className="max-w-5xl space-y-4 md:space-y-6 pb-8">
        
        {/* Dados do Cliente */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Dados do Cliente</h2>
          
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
                placeholder="João Silva"
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
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="joao@email.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">NIF</label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="123456789"
              />
            </div>
          </div>
        </section>

        {/* Tipo de Imóvel Procurado */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">
            Tipo de Imóvel Procurado <span className="text-[#E10600]">*</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Apartamento', 'Moradia', 'Terreno', 'Loja', 'Armazém', 'Escritório'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleArrayValue('property_types', type)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.property_types.includes(type)
                    ? 'border-[#E10600] bg-[#E10600]/20 text-white'
                    : 'border-[#2A2A2E] bg-[#151518] text-[#C5C5C5] hover:border-[#3A3A3E]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {formData.property_types.includes('Apartamento') || formData.property_types.includes('Moradia') ? (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Tipologia</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {['T0', 'T1', 'T2', 'T3', 'T4', 'T5+'].map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => toggleArrayValue('typology', tip)}
                    className={`p-2 rounded-lg border transition-all text-sm ${
                      formData.typology.includes(tip)
                        ? 'border-[#E10600] bg-[#E10600]/20 text-white'
                        : 'border-[#2A2A2E] bg-[#151518] text-[#C5C5C5]'
                    }`}
                  >
                    {tip}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Localização Pretendida */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Localização Pretendida</h2>
          
          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Distritos</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Leiria', 'Lisboa', 'Porto', 'Coimbra', 'Santarém', 'Setúbal', 'Faro', 'Outro'].map((district) => (
                  <button
                    key={district}
                    type="button"
                    onClick={() => toggleArrayValue('preferred_districts', district)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      formData.preferred_districts.includes(district)
                        ? 'border-[#E10600] bg-[#E10600]/20 text-white'
                        : 'border-[#2A2A2E] bg-[#151518] text-[#C5C5C5]'
                    }`}
                  >
                    {district}
                  </button>
                ))}
              </div>
            </div>

            {formData.preferred_districts.includes('Leiria') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Concelhos (Leiria)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Leiria', 'Marinha Grande', 'Pombal', 'Alcobaça', 'Nazaré', 'Porto de Mós'].map((council) => (
                    <button
                      key={council}
                      type="button"
                      onClick={() => toggleArrayValue('preferred_councils', council)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        formData.preferred_councils.includes(council)
                          ? 'border-[#E10600] bg-[#E10600]/20 text-white'
                          : 'border-[#2A2A2E] bg-[#151518] text-[#C5C5C5]'
                      }`}
                    >
                      {council}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Características Desejadas */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Características Desejadas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Área (m²)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={formData.min_area || ''}
                  onChange={(e) => setFormData({ ...formData, min_area: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={formData.max_area || ''}
                  onChange={(e) => setFormData({ ...formData, max_area: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Quartos</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={formData.min_bedrooms || ''}
                  onChange={(e) => setFormData({ ...formData, min_bedrooms: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={formData.max_bedrooms || ''}
                  onChange={(e) => setFormData({ ...formData, max_bedrooms: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Extras Desejados</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { key: 'garage', label: '🚗 Garagem' },
                { key: 'garden', label: '🌳 Jardim' },
                { key: 'pool', label: '🏊 Piscina' },
                { key: 'elevator', label: '🛗 Elevador' },
                { key: 'balcony', label: '🌅 Varanda' },
              ].map((extra) => (
                <button
                  key={extra.key}
                  type="button"
                  onClick={() => setFormData({ 
                    ...formData, 
                    [extra.key]: formData[extra.key as keyof LeadFormData] === true ? null : true 
                  })}
                  className={`p-2 rounded-lg border text-sm transition-all ${
                    formData[extra.key as keyof LeadFormData] === true
                      ? 'border-[#E10600] bg-[#E10600]/20 text-white'
                      : 'border-[#2A2A2E] bg-[#151518] text-[#C5C5C5]'
                  }`}
                >
                  {extra.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Budget */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Orçamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Preço (€)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={formData.min_price || ''}
                  onChange={(e) => setFormData({ ...formData, min_price: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={formData.max_price || ''}
                  onChange={(e) => setFormData({ ...formData, max_price: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Financiamento</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.financing_needed}
                    onChange={(e) => setFormData({ ...formData, financing_needed: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[#C5C5C5]">Necessita financiamento</span>
                </label>
                {formData.financing_needed && (
                  <input
                    type="number"
                    placeholder="Montante aprovado (€)"
                    value={formData.max_financing_amount || ''}
                    onChange={(e) => setFormData({ ...formData, max_financing_amount: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Urgência e Finalidade */}
        <section className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 md:p-6">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-white">Detalhes da Procura</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Urgência</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="baixa">🟢 Baixa - Sem pressa</option>
                <option value="media">🟡 Média - 2-3 meses</option>
                <option value="alta">🟠 Alta - 1 mês</option>
                <option value="urgente">🔴 Urgente - Imediato</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Finalidade</label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as any })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="habitacao_propria">🏠 Habitação Própria</option>
                <option value="investimento">💰 Investimento</option>
                <option value="ferias">🏖️ Casa de Férias</option>
                <option value="arrendamento">📋 Para Arrendar</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Origem do Contacto</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
              >
                <option value="website">🌐 Website</option>
                <option value="telefone">📞 Telefone</option>
                <option value="email">📧 Email</option>
                <option value="presencial">🏢 Presencial</option>
                <option value="referencia">👥 Referência</option>
                <option value="outro">➕ Outro</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#C5C5C5]">Notas / Observações</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
                placeholder="Ex: Preferência por zona central, perto de escolas, etc..."
              />
            </div>
          </div>
        </section>

        {/* Alerta de Matching */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>Sistema de Matching Automático:</strong> Assim que gravar esta lead, o sistema irá procurar imóveis 
            que correspondam aos critérios. Você receberá notificações automáticas quando houver matches!
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-[#060607] py-4 border-t border-[#1F1F22]">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded bg-[#E10600] px-6 py-3 font-medium text-white transition-colors hover:bg-[#C10500] disabled:opacity-50"
          >
            {loading ? 'A guardar...' : '✓ Criar Lead e Ativar Matching'}
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/backoffice/leads'}
            className="w-full sm:w-auto rounded bg-[#2A2A2E] px-6 py-3 font-medium text-white transition-colors hover:bg-[#3A3A3E]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </BackofficeLayout>
  );
}
