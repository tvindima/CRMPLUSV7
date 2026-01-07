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
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
        style={{
          borderWidth: '1px',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
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
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold md:text-xl" style={{ color: 'var(--color-text)' }}>
                {mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
              </h2>
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 flex rounded-lg p-1" style={{ backgroundColor: 'var(--color-background)' }}>
              <button
                onClick={() => setMode('login')}
                className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: mode === 'login' ? 'var(--color-primary)' : 'transparent',
                  color: mode === 'login' ? 'white' : 'var(--color-text-muted)',
                }}
              >
                Entrar
              </button>
              <button
                onClick={() => setMode('register')}
                className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition"
                style={{
                  backgroundColor: mode === 'register' ? 'var(--color-primary)' : 'transparent',
                  color: mode === 'register' ? 'white' : 'var(--color-text-muted)',
                }}
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
                  <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 outline-none"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 outline-none"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 outline-none"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="mb-1 block text-sm" style={{ color: 'var(--color-text-muted)' }}>Telefone (opcional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 outline-none"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Ao {mode === 'login' ? 'entrar' : 'criar conta'}, aceita os nossos{' '}
              <Link href="/termos" className="hover:underline" style={{ color: 'var(--color-primary)' }}>
                Termos
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="hover:underline" style={{ color: 'var(--color-primary)' }}>
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
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
        style={{
          borderWidth: '1px',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <div 
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        {user.name.split(' ')[0]}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-48 rounded-lg py-2 shadow-xl"
          style={{ 
            backgroundColor: 'var(--color-background-secondary)',
            boxShadow: 'inset 0 0 0 1px var(--color-border)',
          }}
        >
          <Link
            href="/favoritos"
            className="block px-4 py-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Os meus favoritos
          </Link>
          <Link
            href="/pesquisas"
            className="block px-4 py-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Pesquisas guardadas
          </Link>
          <Link
            href="/alertas"
            className="block px-4 py-2 text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Alertas de imóveis
          </Link>
          <hr className="my-2" style={{ borderColor: 'var(--color-border)' }} />
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}
