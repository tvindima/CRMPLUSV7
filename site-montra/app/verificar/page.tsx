'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crmplusv7-production.up.railway.app';

function VerificarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token');
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Verificar automaticamente se veio token na URL
  useEffect(() => {
    if (tokenFromUrl) {
      verifyWithToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyWithToken = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/platform/verify-email?token=${token}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Código inválido');
      }

      if (data.success) {
        setSuccess(true);
        setSuccessData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro na verificação');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-avançar para próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submeter quando completo
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace vai para input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || code.join('');
    
    if (fullCode.length !== 6) {
      setError('Introduz o código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/platform/verify-email?code=${fullCode}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Código inválido');
      }

      if (data.success) {
        setSuccess(true);
        setSuccessData(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro na verificação');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email não encontrado. Volta à página de registo.');
      return;
    }

    setResending(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/platform/resend-verification?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch (err: any) {
      setError('Erro ao reenviar. Tenta novamente.');
    } finally {
      setResending(false);
    }
  };

  // Estado para copiar
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Calcular data de expiração do trial (14 dias)
  const getTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Tela de sucesso COMPLETA com todas as credenciais
  if (success && successData) {
    const backofficeUrl = successData.urls?.backoffice || '';
    const siteUrl = successData.urls?.site || '';
    const apiUrl = successData.urls?.api || 'https://crmplusv7-production.up.railway.app';
    const tenantSlug = successData.tenant?.slug || '';
    
    // URLs derivados
    const mobileAppUrl = 'https://apps.apple.com/app/crmplus'; // Placeholder - ajustar quando app estiver na store
    const androidAppUrl = 'https://play.google.com/store/apps/details?id=com.crmplus'; // Placeholder
    
    return (
      <main className="min-h-screen bg-black text-white p-4 py-10">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,128,0.2),transparent_50%)]" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">Conta Criada com Sucesso!</h1>
            <p className="text-white/60">
              A tua empresa <strong className="text-white">{successData.tenant?.name}</strong> está pronta para usar.
            </p>
          </div>

          {/* IMPORTANTE: Aviso para guardar */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-center">
            <p className="text-yellow-400 font-medium">
              ⚠️ Guarda estas informações! Faz screenshot ou copia os dados abaixo.
            </p>
          </div>

          {/* Credenciais Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔐 Dados de Acesso
            </h2>
            
            <div className="space-y-4">
              {/* URL do Backoffice */}
              <div>
                <label className="text-white/50 text-sm block mb-1">🖥️ Backoffice (Gestão)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={backofficeUrl}
                    className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(backofficeUrl, 'backoffice')}
                    className={`px-4 py-3 rounded-lg transition ${
                      copied === 'backoffice' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {copied === 'backoffice' ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              {/* URL do Site */}
              <div>
                <label className="text-white/50 text-sm block mb-1">🌐 Site Web (Montra Pública)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={siteUrl}
                    className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(siteUrl, 'site')}
                    className={`px-4 py-3 rounded-lg transition ${
                      copied === 'site' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {copied === 'site' ? '✓' : '📋'}
                  </button>
                </div>
                <p className="text-white/30 text-xs mt-1">Este é o site público onde os clientes vêem os teus imóveis</p>
              </div>

              {/* Email */}
              <div>
                <label className="text-white/50 text-sm block mb-1">📧 Email de Acesso</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={successData.admin_email || email}
                    className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(successData.admin_email || email, 'email')}
                    className={`px-4 py-3 rounded-lg transition ${
                      copied === 'email' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {copied === 'email' ? '✓' : '📋'}
                  </button>
                </div>
              </div>

              {/* Password Info */}
              <div>
                <label className="text-white/50 text-sm block mb-1">Password</label>
                <div className="bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white/70 text-sm">
                  A password que definiste no registo
                </div>
              </div>
            </div>
          </div>

          {/* Info do Trial */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ⏰ Período de Trial
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-pink-400">14</div>
                <div className="text-white/50 text-sm">dias grátis</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-white">{getTrialEndDate()}</div>
                <div className="text-white/50 text-sm">data de expiração</div>
              </div>
            </div>
            
            <p className="text-white/50 text-sm mt-4 text-center">
              Acesso completo a todas as funcionalidades durante o trial.
            </p>
          </div>

          {/* Próximos Passos */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📋 Próximos Passos
            </h2>
            
            <ol className="space-y-3 text-white/70">
              <li className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm shrink-0">1</span>
                <span>Acede ao backoffice e faz login com as tuas credenciais</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm shrink-0">2</span>
                <span>Personaliza o branding da tua empresa (logo, cores)</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm shrink-0">3</span>
                <span>Convida os teus agentes para a plataforma</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-sm shrink-0">4</span>
                <span>Adiciona os primeiros imóveis e começa a vender!</span>
              </li>
            </ol>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3">
            <a
              href={backofficeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition text-center"
            >
              🚀 Abrir Backoffice
            </a>

            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition text-center"
            >
              🌐 Ver Site Web
            </a>
            
            <button
              onClick={() => {
                const text = `CRM Plus - Dados de Acesso

Empresa: ${successData.tenant?.name}

🖥️ Backoffice (Gestão): ${backofficeUrl}
🌐 Site Web (Montra): ${siteUrl}

📧 Email: ${successData.admin_email || email}
🔐 Password: (a que definiste no registo)

⏰ Trial válido até: ${getTrialEndDate()}`;
                copyToClipboard(text, 'all');
              }}
              className={`w-full py-4 rounded-xl font-semibold transition text-center ${
                copied === 'all'
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {copied === 'all' ? '✓ Copiado!' : '📋 Copiar Todos os Dados'}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-white/40 text-sm mt-8">
            Enviámos também um email com estas informações para <strong>{successData.admin_email || email}</strong>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,0,128,0.3),transparent_50%)]" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              CRM Plus
            </span>
          </Link>
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-2">Verifica o teu Email</h1>
          <p className="text-white/60">
            {email ? (
              <>Enviámos um código para <strong className="text-white">{email}</strong></>
            ) : (
              'Introduz o código de verificação'
            )}
          </p>
        </div>

        {/* Code Input */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold bg-black/50 border border-white/20 rounded-xl text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition disabled:opacity-50"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Resent confirmation */}
          {resent && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm text-center">
              ✅ Código reenviado!
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || code.join('').length !== 6}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                A verificar...
              </>
            ) : (
              '✓ Verificar Código'
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm mb-2">Não recebeste o código?</p>
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="text-pink-400 hover:text-pink-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {resending ? 'A reenviar...' : 'Reenviar código'}
            </button>
          </div>
        </div>

        {/* Back */}
        <p className="text-center text-white/40 text-sm mt-8">
          <Link href="/comecar" className="text-pink-400 hover:underline">
            ← Voltar ao registo
          </Link>
        </p>
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
        <p className="text-white/60 mt-4">A carregar...</p>
      </div>
    </main>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerificarContent />
    </Suspense>
  );
}
