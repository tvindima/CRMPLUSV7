'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

// Opções de selects
const TIPOS_CLIENTE = [
  { value: 'comprador', label: 'Comprador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'investidor', label: 'Investidor' },
  { value: 'arrendatario', label: 'Arrendatário' },
  { value: 'senhorio', label: 'Senhorio' },
  { value: 'lead', label: 'Lead' },
];

const ESTADOS_CIVIS = [
  { value: '', label: 'Selecionar...' },
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'uniao_facto', label: 'União de Facto' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'separado', label: 'Separado(a)' },
];

const REGIMES_CASAMENTO = [
  { value: '', label: 'Selecionar...' },
  { value: 'comunhao_adquiridos', label: 'Comunhão de Adquiridos' },
  { value: 'comunhao_geral', label: 'Comunhão Geral de Bens' },
  { value: 'separacao_bens', label: 'Separação de Bens' },
];

export default function NewClientPage() {
  const router = useRouter();
  // TODO: Integrar autenticação se necessário (token, user)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pessoal' | 'conjuge' | 'empresa' | 'morada'>('pessoal');
  
  const [formData, setFormData] = useState({
    // Dados pessoais
    nome: "",
    nif: "",
    cc: "",
    cc_validade: "",
    data_nascimento: "",
    naturalidade: "",
    nacionalidade: "Portuguesa",
    profissao: "",
    entidade_empregadora: "",
    
    // Estado civil
    estado_civil: "",
    regime_casamento: "",
    data_casamento: "",
    
    // Cônjuge
    conjuge_nome: "",
    conjuge_nif: "",
    conjuge_cc: "",
    conjuge_cc_validade: "",
    conjuge_data_nascimento: "",
    conjuge_naturalidade: "",
    conjuge_nacionalidade: "Portuguesa",
    conjuge_profissao: "",
    conjuge_email: "",
    conjuge_telefone: "",
    
    // Empresa
    is_empresa: false,
    empresa_nome: "",
    empresa_nipc: "",
    empresa_sede: "",
    empresa_capital_social: "",
    empresa_conservatoria: "",
    empresa_matricula: "",
    empresa_cargo: "",
    empresa_poderes: "",
    
    // Contactos
    email: "",
    telefone: "",
    telefone_alt: "",
    
    // Morada
    morada: "",
    numero_porta: "",
    andar: "",
    codigo_postal: "",
    localidade: "",
    concelho: "",
    distrito: "",
    pais: "Portugal",
    
    // Classificação
    client_type: "comprador",
    notas: "",
    tags: [] as string[],
  });

  const needsConjuge = ['casado', 'uniao_facto'].includes(formData.estado_civil);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Preparar dados para envio
      const payload: any = {
        nome: formData.nome,
        client_type: formData.client_type,
        origin: 'manual',
        is_empresa: formData.is_empresa,
        
        // Dados pessoais
        nif: formData.nif || null,
        cc: formData.cc || null,
        cc_validade: formData.cc_validade || null,
        data_nascimento: formData.data_nascimento || null,
        naturalidade: formData.naturalidade || null,
        nacionalidade: formData.nacionalidade || null,
        profissao: formData.profissao || null,
        entidade_empregadora: formData.entidade_empregadora || null,
        
        // Estado civil
        estado_civil: formData.estado_civil || null,
        regime_casamento: formData.regime_casamento || null,
        data_casamento: formData.data_casamento || null,
        
        // Contactos
        email: formData.email || null,
        telefone: formData.telefone || null,
        telefone_alt: formData.telefone_alt || null,
        
        // Morada
        morada: formData.morada || null,
        numero_porta: formData.numero_porta || null,
        andar: formData.andar || null,
        codigo_postal: formData.codigo_postal || null,
        localidade: formData.localidade || null,
        concelho: formData.concelho || null,
        distrito: formData.distrito || null,
        pais: formData.pais || 'Portugal',
        
        // Notas
        notas: formData.notas || null,
        tags: formData.tags,
      };

      // Adicionar dados do cônjuge se casado
      if (needsConjuge) {
        payload.conjuge_nome = formData.conjuge_nome || null;
        payload.conjuge_nif = formData.conjuge_nif || null;
        payload.conjuge_cc = formData.conjuge_cc || null;
        payload.conjuge_cc_validade = formData.conjuge_cc_validade || null;
        payload.conjuge_data_nascimento = formData.conjuge_data_nascimento || null;
        payload.conjuge_naturalidade = formData.conjuge_naturalidade || null;
        payload.conjuge_nacionalidade = formData.conjuge_nacionalidade || null;
        payload.conjuge_profissao = formData.conjuge_profissao || null;
        payload.conjuge_email = formData.conjuge_email || null;
        payload.conjuge_telefone = formData.conjuge_telefone || null;
      }

      // Adicionar dados da empresa se representante
      if (formData.is_empresa) {
        payload.empresa_nome = formData.empresa_nome || null;
        payload.empresa_nipc = formData.empresa_nipc || null;
        payload.empresa_sede = formData.empresa_sede || null;
        payload.empresa_capital_social = formData.empresa_capital_social ? parseFloat(formData.empresa_capital_social) : null;
        payload.empresa_conservatoria = formData.empresa_conservatoria || null;
        payload.empresa_matricula = formData.empresa_matricula || null;
        payload.empresa_cargo = formData.empresa_cargo || null;
        payload.empresa_poderes = formData.empresa_poderes || null;
      }

      const response = await fetch(`${API_URL}/clients/?agent_id=${user?.agent_id || 1}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao criar cliente');
      }

      const data = await response.json();
      console.log('Cliente criado:', data);
      
      router.push("/backoffice/clients");
    } catch (err: any) {
      console.error("Erro ao criar cliente:", err);
      setError(err.message || 'Erro ao criar cliente');
      setLoading(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none";
  const labelClass = "block text-sm text-[#999]";
  const sectionClass = "text-sm font-semibold uppercase tracking-wider text-[#888]";

  return (
    <BackofficeLayout title="Novo Cliente">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Adicionar Novo Cliente</h1>
          <p className="text-sm text-[#999]">Preencha os dados completos do cliente</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-[#23232B]">
          <button
            type="button"
            onClick={() => setActiveTab('pessoal')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pessoal' 
                ? 'border-b-2 border-[#E10600] text-white' 
                : 'text-[#666] hover:text-white'
            }`}
          >
            Dados Pessoais
          </button>
          {needsConjuge && (
            <button
              type="button"
              onClick={() => setActiveTab('conjuge')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'conjuge' 
                  ? 'border-b-2 border-[#E10600] text-white' 
                  : 'text-[#666] hover:text-white'
              }`}
            >
              Cônjuge
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('empresa')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'empresa' 
                ? 'border-b-2 border-[#E10600] text-white' 
                : 'text-[#666] hover:text-white'
            }`}
          >
            Empresa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('morada')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'morada' 
                ? 'border-b-2 border-[#E10600] text-white' 
                : 'text-[#666] hover:text-white'
            }`}
          >
            Morada
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Tab: Dados Pessoais */}
          {activeTab === 'pessoal' && (
            <>
              {/* Identificação */}
              <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
                <h3 className={sectionClass}>Identificação</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className={inputClass}
                      placeholder="Ex: João Manuel Silva Santos"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>NIF</label>
                    <input
                      type="text"
                      value={formData.nif}
                      onChange={(e) => setFormData({...formData, nif: e.target.value})}
                      className={inputClass}
                      placeholder="123456789"
                      maxLength={9}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Nº Cartão Cidadão</label>
                    <input
                      type="text"
                      value={formData.cc}
                      onChange={(e) => setFormData({...formData, cc: e.target.value})}
                      className={inputClass}
                      placeholder="12345678 1 ZZ2"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Validade CC</label>
                    <input
                      type="date"
                      value={formData.cc_validade}
                      onChange={(e) => setFormData({...formData, cc_validade: e.target.value})}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Naturalidade</label>
                    <input
                      type="text"
                      value={formData.naturalidade}
                      onChange={(e) => setFormData({...formData, naturalidade: e.target.value})}
                      className={inputClass}
                      placeholder="Lisboa, Portugal"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Nacionalidade</label>
                    <input
                      type="text"
                      value={formData.nacionalidade}
                      onChange={(e) => setFormData({...formData, nacionalidade: e.target.value})}
                      className={inputClass}
                      placeholder="Portuguesa"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Profissão</label>
                    <input
                      type="text"
                      value={formData.profissao}
                      onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                      className={inputClass}
                      placeholder="Engenheiro Civil"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Entidade Empregadora</label>
                    <input
                      type="text"
                      value={formData.entidade_empregadora}
                      onChange={(e) => setFormData({...formData, entidade_empregadora: e.target.value})}
                      className={inputClass}
                      placeholder="Empresa XYZ, Lda"
                    />
                  </div>
                </div>
              </div>

              {/* Estado Civil */}
              <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
                <h3 className={sectionClass}>Estado Civil</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelClass}>Estado Civil</label>
                    <select
                      value={formData.estado_civil}
                      onChange={(e) => setFormData({...formData, estado_civil: e.target.value})}
                      className={inputClass}
                    >
                      {ESTADOS_CIVIS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {needsConjuge && (
                    <>
                      <div>
                        <label className={labelClass}>Regime de Casamento</label>
                        <select
                          value={formData.regime_casamento}
                          onChange={(e) => setFormData({...formData, regime_casamento: e.target.value})}
                          className={inputClass}
                        >
                          {REGIMES_CASAMENTO.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Data Casamento</label>
                        <input
                          type="date"
                          value={formData.data_casamento}
                          onChange={(e) => setFormData({...formData, data_casamento: e.target.value})}
                          className={inputClass}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contactos */}
              <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
                <h3 className={sectionClass}>Contactos</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={inputClass}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Telefone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      className={inputClass}
                      placeholder="+351 912 345 678"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Telefone Alternativo</label>
                    <input
                      type="tel"
                      value={formData.telefone_alt}
                      onChange={(e) => setFormData({...formData, telefone_alt: e.target.value})}
                      className={inputClass}
                      placeholder="+351 21 234 5678"
                    />
                  </div>
                </div>
              </div>

              {/* Classificação */}
              <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
                <h3 className={sectionClass}>Classificação</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Tipo de Cliente *</label>
                    <select
                      value={formData.client_type}
                      onChange={(e) => setFormData({...formData, client_type: e.target.value})}
                      className={inputClass}
                    >
                      {TIPOS_CLIENTE.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_empresa"
                      checked={formData.is_empresa}
                      onChange={(e) => setFormData({...formData, is_empresa: e.target.checked})}
                      className="h-4 w-4 rounded border-[#23232B] bg-[#0F0F12] text-[#E10600] focus:ring-[#E10600]"
                    />
                    <label htmlFor="is_empresa" className="text-sm text-[#999]">
                      Representa uma Empresa
                    </label>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Notas Internas</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    rows={3}
                    className={inputClass}
                    placeholder="Observações sobre o cliente..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Tab: Cônjuge */}
          {activeTab === 'conjuge' && needsConjuge && (
            <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
              <h3 className={sectionClass}>Dados do Cônjuge</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nome Completo</label>
                  <input
                    type="text"
                    value={formData.conjuge_nome}
                    onChange={(e) => setFormData({...formData, conjuge_nome: e.target.value})}
                    className={inputClass}
                    placeholder="Nome completo do cônjuge"
                  />
                </div>

                <div>
                  <label className={labelClass}>NIF</label>
                  <input
                    type="text"
                    value={formData.conjuge_nif}
                    onChange={(e) => setFormData({...formData, conjuge_nif: e.target.value})}
                    className={inputClass}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>

                <div>
                  <label className={labelClass}>Nº Cartão Cidadão</label>
                  <input
                    type="text"
                    value={formData.conjuge_cc}
                    onChange={(e) => setFormData({...formData, conjuge_cc: e.target.value})}
                    className={inputClass}
                    placeholder="12345678 1 ZZ2"
                  />
                </div>

                <div>
                  <label className={labelClass}>Validade CC</label>
                  <input
                    type="date"
                    value={formData.conjuge_cc_validade}
                    onChange={(e) => setFormData({...formData, conjuge_cc_validade: e.target.value})}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.conjuge_data_nascimento}
                    onChange={(e) => setFormData({...formData, conjuge_data_nascimento: e.target.value})}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Naturalidade</label>
                  <input
                    type="text"
                    value={formData.conjuge_naturalidade}
                    onChange={(e) => setFormData({...formData, conjuge_naturalidade: e.target.value})}
                    className={inputClass}
                    placeholder="Lisboa, Portugal"
                  />
                </div>

                <div>
                  <label className={labelClass}>Nacionalidade</label>
                  <input
                    type="text"
                    value={formData.conjuge_nacionalidade}
                    onChange={(e) => setFormData({...formData, conjuge_nacionalidade: e.target.value})}
                    className={inputClass}
                    placeholder="Portuguesa"
                  />
                </div>

                <div>
                  <label className={labelClass}>Profissão</label>
                  <input
                    type="text"
                    value={formData.conjuge_profissao}
                    onChange={(e) => setFormData({...formData, conjuge_profissao: e.target.value})}
                    className={inputClass}
                    placeholder="Profissão"
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={formData.conjuge_email}
                    onChange={(e) => setFormData({...formData, conjuge_email: e.target.value})}
                    className={inputClass}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className={labelClass}>Telefone</label>
                  <input
                    type="tel"
                    value={formData.conjuge_telefone}
                    onChange={(e) => setFormData({...formData, conjuge_telefone: e.target.value})}
                    className={inputClass}
                    placeholder="+351 912 345 678"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Empresa */}
          {activeTab === 'empresa' && (
            <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
              <div className="flex items-center justify-between">
                <h3 className={sectionClass}>Representante de Empresa</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_empresa}
                    onChange={(e) => setFormData({...formData, is_empresa: e.target.checked})}
                    className="h-4 w-4 rounded border-[#23232B] bg-[#0F0F12] text-[#E10600] focus:ring-[#E10600]"
                  />
                  <span className="text-sm text-[#999]">Ativar</span>
                </label>
              </div>
              
              {formData.is_empresa ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nome da Empresa</label>
                    <input
                      type="text"
                      value={formData.empresa_nome}
                      onChange={(e) => setFormData({...formData, empresa_nome: e.target.value})}
                      className={inputClass}
                      placeholder="Empresa XYZ, Lda"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>NIPC</label>
                    <input
                      type="text"
                      value={formData.empresa_nipc}
                      onChange={(e) => setFormData({...formData, empresa_nipc: e.target.value})}
                      className={inputClass}
                      placeholder="509123456"
                      maxLength={9}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Capital Social (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.empresa_capital_social}
                      onChange={(e) => setFormData({...formData, empresa_capital_social: e.target.value})}
                      className={inputClass}
                      placeholder="50000.00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Sede</label>
                    <input
                      type="text"
                      value={formData.empresa_sede}
                      onChange={(e) => setFormData({...formData, empresa_sede: e.target.value})}
                      className={inputClass}
                      placeholder="Rua da Empresa, 123, Lisboa"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Conservatória</label>
                    <input
                      type="text"
                      value={formData.empresa_conservatoria}
                      onChange={(e) => setFormData({...formData, empresa_conservatoria: e.target.value})}
                      className={inputClass}
                      placeholder="Conservatória de Lisboa"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Matrícula</label>
                    <input
                      type="text"
                      value={formData.empresa_matricula}
                      onChange={(e) => setFormData({...formData, empresa_matricula: e.target.value})}
                      className={inputClass}
                      placeholder="509123456"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Cargo do Representante</label>
                    <input
                      type="text"
                      value={formData.empresa_cargo}
                      onChange={(e) => setFormData({...formData, empresa_cargo: e.target.value})}
                      className={inputClass}
                      placeholder="Gerente / Administrador"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Poderes de Representação</label>
                    <textarea
                      value={formData.empresa_poderes}
                      onChange={(e) => setFormData({...formData, empresa_poderes: e.target.value})}
                      rows={2}
                      className={inputClass}
                      placeholder="Descrição dos poderes conferidos..."
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#666]">
                  Ative esta opção se o cliente representa uma empresa.
                </p>
              )}
            </div>
          )}

          {/* Tab: Morada */}
          {activeTab === 'morada' && (
            <div className="space-y-4 rounded-lg border border-[#23232B] bg-[#0a0a0c] p-4">
              <h3 className={sectionClass}>Morada</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className={labelClass}>Morada</label>
                  <input
                    type="text"
                    value={formData.morada}
                    onChange={(e) => setFormData({...formData, morada: e.target.value})}
                    className={inputClass}
                    placeholder="Rua, Avenida, Praça..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Nº Porta</label>
                    <input
                      type="text"
                      value={formData.numero_porta}
                      onChange={(e) => setFormData({...formData, numero_porta: e.target.value})}
                      className={inputClass}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Andar</label>
                    <input
                      type="text"
                      value={formData.andar}
                      onChange={(e) => setFormData({...formData, andar: e.target.value})}
                      className={inputClass}
                      placeholder="2º Dto"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Código Postal</label>
                  <input
                    type="text"
                    value={formData.codigo_postal}
                    onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})}
                    className={inputClass}
                    placeholder="1234-567"
                  />
                </div>

                <div>
                  <label className={labelClass}>Localidade</label>
                  <input
                    type="text"
                    value={formData.localidade}
                    onChange={(e) => setFormData({...formData, localidade: e.target.value})}
                    className={inputClass}
                    placeholder="Freguesia"
                  />
                </div>

                <div>
                  <label className={labelClass}>Concelho</label>
                  <input
                    type="text"
                    value={formData.concelho}
                    onChange={(e) => setFormData({...formData, concelho: e.target.value})}
                    className={inputClass}
                    placeholder="Lisboa"
                  />
                </div>

                <div>
                  <label className={labelClass}>Distrito</label>
                  <input
                    type="text"
                    value={formData.distrito}
                    onChange={(e) => setFormData({...formData, distrito: e.target.value})}
                    className={inputClass}
                    placeholder="Lisboa"
                  />
                </div>

                <div>
                  <label className={labelClass}>País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({...formData, pais: e.target.value})}
                    className={inputClass}
                    placeholder="Portugal"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 rounded-lg border border-[#23232B] bg-transparent px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#1a1a22]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#E10600] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-[#c00500] disabled:opacity-50"
            >
              {loading ? "A criar..." : "Criar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
