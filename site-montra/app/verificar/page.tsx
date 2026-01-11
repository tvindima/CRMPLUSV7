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

  // Tela de sucesso
  if (success && successData) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Conta Criada!</h1>
          <p className="text-white/60 mb-8">
            A tua empresa <strong className="text-white">{successData.tenant?.name}</strong> está pronta.
          </p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">📋 Próximos passos:</h3>
            <ol className="space-y-3 text-white/70">
              <li className="flex gap-3">
                <span className="text-pink-500">1.</span>
                Acede ao backoffice
              </li>
              <li className="flex gap-3">
                <span className="text-pink-500">2.</span>
                Personaliza o branding
              </li>
              <li className="flex gap-3">
                <span className="text-pink-500">3.</span>
                Adiciona os teus agentes
              </li>
              <li className="flex gap-3">
                <span className="text-pink-500">4.</span>
                Cria os teus imóveis
              </li>
            </ol>
          </div>

          <a
            href={successData.urls?.backoffice || '#'}
            className="inline-block w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition"
          >
            🚀 Ir para o Backoffice
          </a>
          
          <p className="mt-4 text-white/40 text-sm">
            Email: {successData.admin_email}
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
