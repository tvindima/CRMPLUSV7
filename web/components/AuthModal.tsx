'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function AuthModal() {
  const { login, register, isLoading: authLoading, error: authError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        await register(formData.name, formData.email, formData.password, formData.phone || undefined);
      } else {
        await login(formData.email, formData.password);
      }

      setIsOpen(false);
      // Limpar form
      setFormData({ name: '', email: '', password: '', phone: '' });
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-[#2A2A2E] px-4 py-2 text-sm text-[#C5C5C5] transition hover:border-[#E10600] hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Entrar / Criar conta
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#151518] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white md:text-xl">
                {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-[#C5C5C5] hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 flex rounded-lg bg-[#0B0B0D] p-1">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === 'login' ? 'bg-[#E10600] text-white' : 'text-[#C5C5C5]'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === 'register' ? 'bg-[#E10600] text-white' : 'text-[#C5C5C5]'
                }`}
              >
                Registar
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm text-[#C5C5C5]">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-[#C5C5C5]">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm text-[#C5C5C5]">Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-white outline-none focus:border-[#E10600]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#E10600] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c10500] disabled:opacity-50"
              >
                {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#C5C5C5]">
              Ao {mode === 'login' ? 'entrar' : 'criar conta'}, aceita os nossos{' '}
              <Link href="/termos" className="text-[#E10600] hover:underline">
                Termos
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="text-[#E10600] hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  if (!isAuthenticated || !user) {
    return <AuthModal />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-[#2A2A2E] px-4 py-2 text-sm text-white transition hover:border-[#E10600]"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E10600] text-xs font-semibold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        {user.name.split(' ')[0]}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-[#151518] py-2 shadow-xl ring-1 ring-[#2A2A2E]">
          <Link
            href="/favoritos"
            className="block px-4 py-2 text-sm text-[#C5C5C5] hover:bg-[#0B0B0D] hover:text-white"
          >
            Os meus favoritos
          </Link>
          <Link
            href="/pesquisas"
            className="block px-4 py-2 text-sm text-[#C5C5C5] hover:bg-[#0B0B0D] hover:text-white"
          >
            Pesquisas guardadas
          </Link>
          <Link
            href="/alertas"
            className="block px-4 py-2 text-sm text-[#C5C5C5] hover:bg-[#0B0B0D] hover:text-white"
          >
            Alertas de imóveis
          </Link>
          <hr className="my-2 border-[#2A2A2E]" />
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm text-[#C5C5C5] hover:bg-[#0B0B0D] hover:text-white"
          >
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
