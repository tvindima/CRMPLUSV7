'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  User,
  Mail,
  Phone,
  Globe,
  Palette,
  Briefcase,
  Crown,
  AlertCircle,
  Copy,
  CheckCircle,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

// Setores disponíveis
const SECTORS = [
  { slug: 'real_estate', name: 'Imobiliário', icon: '🏠', description: 'Gestão de imóveis, leads e transações' },
  { slug: 'automotive', name: 'Automóvel', icon: '🚗', description: 'Stands, veículos e test drives' },
  { slug: 'services', name: 'Serviços', icon: '💼', description: 'Consultoria, formação e serviços B2B' },
  { slug: 'retail', name: 'Retalho', icon: '🛍️', description: 'Lojas, produtos e encomendas' },
  { slug: 'hospitality', name: 'Hotelaria', icon: '🏨', description: 'Hotéis, reservas e eventos' },
  { slug: 'other', name: 'Outro', icon: '📦', description: 'Configuração genérica personalizável' },
];

// Planos disponíveis
const PLANS = [
  { slug: 'trial', name: 'Trial', maxAgents: 3, maxProperties: 25, price: 'Grátis', days: 14, popular: false },
  { slug: 'basic', name: 'Basic', maxAgents: 5, maxProperties: 100, price: '€49/mês', days: null, popular: false },
  { slug: 'pro', name: 'Pro', maxAgents: 20, maxProperties: 500, price: '€149/mês', days: null, popular: true },
  { slug: 'enterprise', name: 'Enterprise', maxAgents: 100, maxProperties: 10000, price: 'Contactar', days: null, popular: false },
];

interface FormData {
  // Step 1: Empresa
  companyName: string;
  sector: string;
  subSector: string;
  phone: string;
  
  // Step 2: Plano
  plan: string;
  
  // Step 3: Admin
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  generatePassword: boolean;
  
  // Step 4: Domínios (opcional)
  primaryDomain: string;
  backofficeDomain: string;
  
  // Step 5: Branding (opcional)
  logoUrl: string;
  primaryColor: string;
  
  // Step 6: Terminologia personalizada (opcional)
  customTerminology: {
    item?: string;
    items?: string;
    visit?: string;
    visits?: string;
  };
}

interface ProvisionResult {
  success: boolean;
  tenant?: {
    id: number;
    slug: string;
    name: string;
    status: string;
  };
  admin_email?: string;
  admin_password?: string;
  admin_created: boolean;
  urls: {
    backoffice: string;
    site: string;
    api: string;
  };
  errors: string[];
}

export default function NewTenantPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [subSectors, setSubSectors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    sector: 'real_estate',
    subSector: '',
    phone: '',
    plan: 'trial',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    generatePassword: true,
    primaryDomain: '',
    backofficeDomain: '',
    logoUrl: '',
    primaryColor: '#E10600',
    customTerminology: {},
  });

  const totalSteps = needsSubSector() ? 7 : 6;

  // Carregar sub-sectores disponíveis
  useEffect(() => {
    fetch(`${API_URL}/platform/sub-sectors`)
      .then(res => res.json())
      .then(data => setSubSectors(data.sub_sectors || {}))
      .catch(err => console.error('Error loading sub-sectors:', err));
  }, []);

  // Verificar se sector precisa de sub-sector
  function needsSubSector() {
    return ['services', 'retail', 'other'].includes(formData.sector);
  }

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName.trim().length >= 2;
      case 2:
        // Step 2 é sub-sector (se necessário) ou plano
        if (needsSubSector()) {
          return !!formData.subSector;
        }
        return !!formData.plan;
      case 3:
        return needsSubSector() ? !!formData.plan : formData.adminEmail.includes('@') && formData.adminName.trim().length >= 2;
      case 4:
        return needsSubSector() ? formData.adminEmail.includes('@') && formData.adminName.trim().length >= 2 : true;
      case 5:
      case 6:
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    const token = Cookies.get('platform_token');
    
    try {
      const response = await fetch(`${API_URL}/platform/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.companyName,
          sector: formData.sector,
          sub_sector: formData.subSector || null,
          plan: formData.plan,
          admin_email: formData.adminEmail || null,
          admin_name: formData.adminName || null,
          admin_password: formData.generatePassword ? null : formData.adminPassword,
          primary_domain: formData.primaryDomain || null,
          backoffice_domain: formData.backofficeDomain || null,
          logo_url: formData.logoUrl || null,
          primary_color: formData.primaryColor || null,
          custom_terminology: Object.keys(formData.customTerminology).length > 0 ? formData.customTerminology : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao criar tenant');
      }
      
      setResult(data);
      setCurrentStep(totalSteps + 1); // Success step
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Step components
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Nome da Empresa *
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => updateForm('companyName', e.target.value)}
          placeholder="Ex: Imóveis Mais Leiria"
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-3">
          Setor de Atividade *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SECTORS.map((sector) => (
            <button
              key={sector.slug}
              onClick={() => updateForm('sector', sector.slug)}
              className={`p-4 rounded-xl border text-left transition-all ${
                formData.sector === sector.slug
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl mb-2 block">{sector.icon}</span>
              <p className="font-medium text-white">{sector.name}</p>
              <p className="text-xs text-text-muted mt-1">{sector.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Telefone (opcional)
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
            placeholder="+351 912 345 678"
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );

  const renderStep1_5SubSector = () => (
    <div className="space-y-6">
      <p className="text-text-muted mb-2">
        Para sectores genéricos, escolhe uma sub-categoria para terminologia mais específica.
      </p>

      <div className="grid gap-3">
        {Object.entries(subSectors).map(([slug, name]) => (
          <button
            key={slug}
            onClick={() => updateForm('subSector', slug)}
            className={`p-4 rounded-xl border text-left transition-all ${
              formData.subSector === slug
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium text-white">{name}</p>
            <p className="text-xs text-text-muted mt-1">
              {slug === 'training' && 'Para empresas de formação e educação'}
              {slug === 'law_firm' && 'Para escritórios de advogados'}
              {slug === 'consulting' && 'Para consultoria e serviços profissionais'}
              {slug === 'health' && 'Para clínicas e saúde'}
              {slug === 'accounting' && 'Para contabilidade e finanças'}
              {slug === 'engineering' && 'Para engenharia e projetos técnicos'}
              {slug === 'manufacturing' && 'Para fabricação e indústria'}
              {slug === 'construction' && 'Para construção civil'}
            </p>
          </button>
        ))}
        
        <button
          onClick={() => updateForm('subSector', 'none')}
          className={`p-4 rounded-xl border text-left transition-all ${
            formData.subSector === 'none'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <p className="font-medium text-white">Não especificar</p>
          <p className="text-xs text-text-muted mt-1">
            Usar terminologia genérica (pode personalizar depois)
          </p>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-text-muted mb-6">
        Escolhe o plano mais adequado para este tenant. Pode ser alterado posteriormente.
      </p>
      
      <div className="grid gap-4">
        {PLANS.map((plan) => (
          <button
            key={plan.slug}
            onClick={() => updateForm('plan', plan.slug)}
            className={`p-5 rounded-xl border text-left transition-all relative ${
              formData.plan === plan.slug
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {plan.popular && (
              <span className="absolute top-3 right-3 px-2 py-1 bg-primary text-white text-xs font-medium rounded-full">
                Popular
              </span>
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className={`w-5 h-5 ${formData.plan === plan.slug ? 'text-primary' : 'text-text-muted'}`} />
                  <h3 className="font-semibold text-white text-lg">{plan.name}</h3>
                </div>
                <p className="text-2xl font-bold text-white mt-2">{plan.price}</p>
                {plan.days && (
                  <p className="text-sm text-text-muted">{plan.days} dias</p>
                )}
              </div>
              <div className="text-right text-sm text-text-muted">
                <p>Até {plan.maxAgents} agentes</p>
                <p>Até {plan.maxProperties} propriedades</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <p className="text-text-muted mb-2">
        Configura o administrador inicial deste tenant. Receberá acesso completo ao backoffice.
      </p>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Email do Admin *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="email"
            value={formData.adminEmail}
            onChange={(e) => updateForm('adminEmail', e.target.value)}
            placeholder="admin@empresa.com"
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Nome do Admin *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={formData.adminName}
            onChange={(e) => updateForm('adminName', e.target.value)}
            placeholder="João Silva"
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.generatePassword}
            onChange={(e) => updateForm('generatePassword', e.target.checked)}
            className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary"
          />
          <span className="text-white">Gerar password segura automaticamente</span>
        </label>
      </div>

      {!formData.generatePassword && (
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.adminPassword}
            onChange={(e) => updateForm('adminPassword', e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <p className="text-text-muted mb-2">
        Configura os domínios personalizados (opcional). Se não configurares, serão atribuídos subdomínios automáticos.
      </p>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Domínio Principal (Site)
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={formData.primaryDomain}
            onChange={(e) => updateForm('primaryDomain', e.target.value)}
            placeholder="empresa.com"
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Domínio Backoffice
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={formData.backofficeDomain}
            onChange={(e) => updateForm('backofficeDomain', e.target.value)}
            placeholder="backoffice.empresa.com"
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-blue-400 text-sm">
          <strong>Nota:</strong> Se deixares em branco, o tenant ficará acessível via subdomínio automático.
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <p className="text-text-muted mb-2">
        Personaliza o branding do tenant (opcional).
      </p>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          URL do Logo
        </label>
        <input
          type="url"
          value={formData.logoUrl}
          onChange={(e) => updateForm('logoUrl', e.target.value)}
          placeholder="https://empresa.com/logo.png"
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-2">
          Cor Primária
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={formData.primaryColor}
            onChange={(e) => updateForm('primaryColor', e.target.value)}
            className="w-12 h-12 rounded-lg border border-border cursor-pointer"
          />
          <input
            type="text"
            value={formData.primaryColor}
            onChange={(e) => updateForm('primaryColor', e.target.value)}
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 rounded-xl border border-border">
        <p className="text-sm text-text-muted mb-4">Preview:</p>
        <div className="flex items-center gap-4">
          {formData.logoUrl ? (
            <img src={formData.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain" />
          ) : (
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.primaryColor + '20' }}
            >
              <Building2 className="w-6 h-6" style={{ color: formData.primaryColor }} />
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{formData.companyName || 'Nome da Empresa'}</p>
            <p className="text-sm text-text-muted">{SECTORS.find(s => s.slug === formData.sector)?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-white">Tenant Criado com Sucesso!</h2>
        <p className="text-text-muted mt-2">{result?.tenant?.name} está pronto para usar.</p>
      </div>

      {/* Credenciais do Admin */}
      {result?.admin_created && (
        <div className="bg-background border border-border rounded-xl p-6 text-left">
          <h3 className="font-semibold text-white mb-4">Credenciais do Admin</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-text-muted">Email</p>
              <p className="text-white font-mono">{result.admin_email}</p>
            </div>
            
            {result.admin_password && (
              <div>
                <p className="text-sm text-text-muted">Password (gerada)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-background-secondary rounded-lg text-primary font-mono">
                    {result.admin_password}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.admin_password!)}
                    className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                  >
                    {copiedPassword ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-muted" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-warning mt-2">
                  ⚠️ Guarda esta password! Não será mostrada novamente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* URLs */}
      {result?.urls && (
        <div className="bg-background border border-border rounded-xl p-6 text-left">
          <h3 className="font-semibold text-white mb-4">URLs de Acesso</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Backoffice:</span>
              <a href={result.urls.backoffice} target="_blank" className="text-primary hover:underline">
                {result.urls.backoffice}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Site:</span>
              <a href={result.urls.site} target="_blank" className="text-primary hover:underline">
                {result.urls.site}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push('/tenants')}
          className="px-6 py-3 bg-background-secondary border border-border text-white rounded-xl hover:bg-background transition-colors"
        >
          Ver Todos os Tenants
        </button>
        <button
          onClick={() => {
            setCurrentStep(1);
            setResult(null);
            setFormData({
              companyName: '',
              sector: 'real_estate',
              subSector: '',
              phone: '',
              plan: 'trial',
              adminEmail: '',
              adminName: '',
              adminPassword: '',
              generatePassword: true,
              primaryDomain: '',
              backofficeDomain: '',
              logoUrl: '',
              primaryColor: '#E10600',
              customTerminology: {},
            });
          }}
          className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          Criar Outro Tenant
        </button>
      </div>
    </div>
  );

  const renderStepCustomTerminology = () => (
    <div className="space-y-6">
      <p className="text-text-muted mb-2">
        Personaliza os termos-chave do sistema (opcional). Se não preencheres, serão usados os termos padrão do sub-sector ou sector.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Item (singular)
          </label>
          <input
            type="text"
            value={formData.customTerminology.item || ''}
            onChange={(e) => updateForm('customTerminology', { ...formData.customTerminology, item: e.target.value })}
            placeholder="Ex: Curso, Processo, Produto"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Itens (plural)
          </label>
          <input
            type="text"
            value={formData.customTerminology.items || ''}
            onChange={(e) => updateForm('customTerminology', { ...formData.customTerminology, items: e.target.value })}
            placeholder="Ex: Cursos, Processos, Produtos"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Visita/Contacto (singular)
          </label>
          <input
            type="text"
            value={formData.customTerminology.visit || ''}
            onChange={(e) => updateForm('customTerminology', { ...formData.customTerminology, visit: e.target.value })}
            placeholder="Ex: Formação, Consulta, Atendimento"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Visitas/Contactos (plural)
          </label>
          <input
            type="text"
            value={formData.customTerminology.visits || ''}
            onChange={(e) => updateForm('customTerminology', { ...formData.customTerminology, visits: e.target.value })}
            placeholder="Ex: Formações, Consultas, Atendimentos"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <p className="text-blue-400 text-sm">
          <strong>Dica:</strong> Estes termos aparecerão em toda a interface do sistema. Escolhe nomes que façam sentido para o negócio do cliente.
        </p>
      </div>
    </div>
  );

  const stepTitles = needsSubSector() 
    ? ['Dados da Empresa', 'Sub-Categoria', 'Escolher Plano', 'Admin Inicial', 'Domínios', 'Branding', 'Terminologia']
    : ['Dados da Empresa', 'Escolher Plano', 'Admin Inicial', 'Domínios', 'Branding', 'Terminologia'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/tenants')}
          className="p-2 text-text-muted hover:text-white hover:bg-background-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Criar Novo Tenant</h1>
          <p className="text-text-muted">Configurar nova empresa na plataforma</p>
        </div>
      </div>

      {currentStep <= totalSteps && (
        <>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {stepTitles.map((title, index) => {
              const step = index + 1;
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        isCompleted
                          ? 'bg-success text-white'
                          : isActive
                          ? 'bg-primary text-white'
                          : 'bg-background-secondary text-text-muted border border-border'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : step}
                    </div>
                    <span className={`text-xs mt-2 hidden sm:block ${isActive ? 'text-white' : 'text-text-muted'}`}>
                      {title}
                    </span>
                  </div>
                  {step < totalSteps && (
                    <div
                      className={`w-12 sm:w-20 h-0.5 mx-2 ${
                        isCompleted ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="bg-background-secondary rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">
              {stepTitles[currentStep - 1]}
            </h2>
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && needsSubSector() && renderStep1_5SubSector()}
            {currentStep === 2 && !needsSubSector() && renderStep2()}
            {currentStep === 3 && needsSubSector() && renderStep2()}
            {currentStep === 3 && !needsSubSector() && renderStep3()}
            {currentStep === 4 && needsSubSector() && renderStep3()}
            {currentStep === 4 && !needsSubSector() && renderStep4()}
            {currentStep === 5 && needsSubSector() && renderStep4()}
            {currentStep === 5 && !needsSubSector() && renderStep5()}
            {currentStep === 6 && needsSubSector() && renderStep5()}
            {currentStep === 6 && !needsSubSector() && renderStepCustomTerminology()}
            {currentStep === 7 && needsSubSector() && renderStepCustomTerminology()}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <p className="text-danger">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-text-muted hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Anterior
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-success text-white rounded-xl hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    A criar...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Criar Tenant
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}

      {/* Success State */}
      {currentStep > totalSteps && result && renderSuccess()}
    </div>
  );
}
