'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NovoTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Dados da empresa
    companyName: '',
    tradeName: '',
    nif: '',
    email: '',
    phone: '',
    // Domínios
    domain: '',
    backofficeSubdomain: '',
    // Admin
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    // Plano
    plan: 'professional',
    // Branding
    primaryColor: '#E10600',
    slogan: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-preencher subdomínio baseado no nome
    if (name === 'tradeName' && !formData.backofficeSubdomain) {
      const subdomain = value.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ 
        ...prev, 
        backofficeSubdomain: `backoffice.${subdomain}.com` 
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Implementar criação real via API
      // 1. Criar entrada na BD de tenants
      // 2. Provisionar projeto no Railway
      // 3. Criar base de dados PostgreSQL
      // 4. Configurar variáveis de ambiente
      // 5. Deploy do backend
      // 6. Configurar domínios no Vercel
      // 7. Enviar email de boas-vindas

      console.log('Criando tenant:', formData);
      
      // Simular delay
      await new Promise(r => setTimeout(r, 2000));
      
      alert('Tenant criado com sucesso! (simulação)');
      router.push('/s/tenants');
    } catch (err) {
      setError('Erro ao criar tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <a href="/s/tenants" className="text-white/40 text-sm hover:text-white/60 mb-2 inline-block">
          ← Voltar aos Tenants
        </a>
        <h1 className="text-2xl font-semibold">Novo Tenant</h1>
        <p className="text-white/50 text-sm mt-1">Criar nova imobiliária na plataforma</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-pink-500 text-white' : 'bg-[#222] text-white/40'
            }`}>
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-white' : 'text-white/40'}`}>
              {s === 1 && 'Empresa'}
              {s === 2 && 'Domínios'}
              {s === 3 && 'Admin'}
              {s === 4 && 'Plano'}
            </span>
            {s < 4 && <div className="w-8 h-px bg-[#333]" />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        {/* Step 1: Dados da Empresa */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-medium mb-4">Dados da Empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/50 block mb-1">Nome Comercial *</label>
                <input
                  type="text"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder="Ex: Imóveis Mais"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Razão Social</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Ex: Imóveis Mais Lda"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">NIF</label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif}
                  onChange={handleChange}
                  placeholder="Ex: 509123456"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Telefone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ex: +351 912 345 678"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-white/50 block mb-1">Email da Empresa *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: geral@imoveismais.com"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Domínios */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-medium mb-4">Configuração de Domínios</h3>
            <div>
              <label className="text-sm text-white/50 block mb-1">Domínio Principal (Site Público) *</label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="Ex: imoveismais.com"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
              />
              <p className="text-xs text-white/30 mt-1">O site público para clientes verem imóveis</p>
            </div>
            <div>
              <label className="text-sm text-white/50 block mb-1">Domínio Backoffice *</label>
              <input
                type="text"
                name="backofficeSubdomain"
                value={formData.backofficeSubdomain}
                onChange={handleChange}
                placeholder="Ex: backoffice.imoveismais.com"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
              />
              <p className="text-xs text-white/30 mt-1">O backoffice de gestão para staff</p>
            </div>
            <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <p className="text-sm text-white/50 mb-2">📋 Após criação, configurar DNS:</p>
              <code className="text-xs text-pink-400 block">
                {formData.domain || 'dominio.com'} → CNAME → cname.vercel-dns.com
              </code>
              <code className="text-xs text-pink-400 block mt-1">
                {formData.backofficeSubdomain || 'backoffice.dominio.com'} → CNAME → cname.vercel-dns.com
              </code>
            </div>
          </div>
        )}

        {/* Step 3: Admin */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-medium mb-4">Administrador do Tenant</h3>
            <p className="text-sm text-white/50 mb-4">
              Este será o primeiro utilizador com acesso total ao backoffice da imobiliária.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm text-white/50 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="Ex: joao@imoveismais.com"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Password Inicial *</label>
                <input
                  type="text"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="Gerar automaticamente"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Plano e Branding */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-medium mb-4">Plano e Branding</h3>
            <div>
              <label className="text-sm text-white/50 block mb-1">Plano *</label>
              <select
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
              >
                <option value="starter">Starter - €49/mês (até 3 agentes)</option>
                <option value="professional">Professional - €99/mês (até 15 agentes)</option>
                <option value="enterprise">Enterprise - €199/mês (ilimitado)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/50 block mb-1">Cor Principal</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/50 block mb-1">Slogan</label>
                <input
                  type="text"
                  name="slogan"
                  value={formData.slogan}
                  onChange={handleChange}
                  placeholder="Ex: A sua casa, o nosso compromisso"
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white"
                />
              </div>
            </div>

            {/* Resumo */}
            <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <p className="text-sm font-medium mb-3">📋 Resumo do Tenant</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-white/50">Empresa:</div>
                <div>{formData.tradeName || '-'}</div>
                <div className="text-white/50">Domínio:</div>
                <div>{formData.domain || '-'}</div>
                <div className="text-white/50">Admin:</div>
                <div>{formData.adminEmail || '-'}</div>
                <div className="text-white/50">Plano:</div>
                <div className="capitalize">{formData.plan}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-[#222]">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-6 py-2 text-white/50 hover:text-white disabled:opacity-30 transition"
          >
            ← Anterior
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? 'A criar...' : '🚀 Criar Tenant'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
