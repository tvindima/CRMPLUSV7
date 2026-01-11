'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

// Setores disponíveis
const SECTORS = [
  { slug: 'real_estate', name: 'Imobiliário', icon: '🏠' },
  { slug: 'automotive', name: 'Automóvel', icon: '🚗' },
  { slug: 'services', name: 'Serviços', icon: '💼' },
  { slug: 'retail', name: 'Retalho', icon: '🛒' },
  { slug: 'hospitality', name: 'Hotelaria', icon: '🏨' },
  { slug: 'other', name: 'Outro', icon: '📦' },
];

export default function ComecarPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    sector: 'real_estate',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: '',
    phone: '',
    accept_terms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.company_name.trim()) {
      setError('Nome da empresa é obrigatório');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.admin_name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.admin_email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      setError('Email inválido');
      return false;
    }
    if (!formData.admin_password || formData.admin_password.length < 8) {
      setError('Password deve ter pelo menos 8 caracteres');
      return false;
    }
    if (formData.admin_password !== formData.admin_password_confirm) {
      setError('Passwords não coincidem');
      return false;
    }
    if (!formData.accept_terms) {
      setError('Deve aceitar os termos e condições');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/platform/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.company_name,
          sector: formData.sector,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
          phone: formData.phone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erro ao criar conta');
      }

      if (data.success && data.requires_verification) {
        setSuccess(true);
        // Redirecionar para página de verificação após 2 segundos
        setTimeout(() => {
          router.push(`/verificar?email=${encodeURIComponent(formData.admin_email)}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">📧</div>
          <h1 className="text-3xl font-bold mb-4">Verifica o teu Email!</h1>
          <p className="text-white/60 mb-6">
            Enviámos um código de verificação para<br />
            <strong className="text-white">{formData.admin_email}</strong>
          </p>
          <p className="text-sm text-white/40">
            A redirecionar para a página de verificação...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,128,0.3),transparent_50%)]" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              CRM Plus
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Começar Grátis</h1>
          <p className="text-white/60">14 dias de trial • Sem cartão de crédito</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                  : 'bg-white/10 text-white/40'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s ? 'text-white' : 'text-white/40'}`}>
                {s === 1 ? 'Empresa' : 'Conta'}
              </span>
              {s < 2 && <div className="w-12 h-0.5 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Step 1: Empresa */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/60 mb-2">Nome da Empresa *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Ex: Imóveis Premium"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Setor de Atividade *</label>
                <div className="grid grid-cols-2 gap-3">
                  {SECTORS.map((sector) => (
                    <button
                      key={sector.slug}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sector: sector.slug }))}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        formData.sector === sector.slug
                          ? 'border-pink-500 bg-pink-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{sector.icon}</span>
                      <span className="text-sm font-medium">{sector.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Telefone (opcional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+351 912 345 678"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>
            </div>
          )}

          {/* Step 2: Conta */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-white/60 mb-2">O teu Nome *</label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  placeholder="João Silva"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Email *</label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  placeholder="joao@empresa.com"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Password *</label>
                <input
                  type="password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Confirmar Password *</label>
                <input
                  type="password"
                  name="admin_password_confirm"
                  value={formData.admin_password_confirm}
                  onChange={handleChange}
                  placeholder="Repetir password"
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/30 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="accept_terms"
                  checked={formData.accept_terms}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-pink-500 focus:ring-pink-500 focus:ring-offset-0"
                />
                <span className="text-sm text-white/60 group-hover:text-white/80 transition">
                  Li e aceito os{' '}
                  <a href="/termos" className="text-pink-400 hover:underline">Termos de Serviço</a>
                  {' '}e a{' '}
                  <a href="/privacidade" className="text-pink-400 hover:underline">Política de Privacidade</a>
                </span>
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 text-white/60 hover:text-white transition"
              >
                ← Voltar
              </button>
            )}
            
            {step < 2 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Continuar →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    A criar conta...
                  </>
                ) : (
                  '🚀 Criar Conta Grátis'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8">
          Já tens conta?{' '}
          <a href="https://backoffice.imoveismais.com" className="text-pink-400 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
