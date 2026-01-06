'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Implementar autenticação real com backend
      // Por agora, validação local para desenvolvimento
      const SUPER_ADMINS = [
        { email: 'admin@crmplus.pt', password: 'CrmPlus2026!' },
        { email: 'tiago@crmplus.pt', password: 'CrmPlus2026!' },
      ];

      const validUser = SUPER_ADMINS.find(
        u => u.email === email && u.password === password
      );

      if (validUser) {
        // Guardar sessão (temporário - substituir por JWT real)
        localStorage.setItem('superadmin_session', JSON.stringify({
          email: validUser.email,
          role: 'superadmin',
          exp: Date.now() + 8 * 60 * 60 * 1000 // 8 horas
        }));
        router.push('/s/dashboard');
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Fundo subtil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.3),transparent_70%)]" />
      
      <div className="relative w-full max-w-sm">
        {/* Card de login minimalista */}
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-2xl font-light text-white/80 tracking-wider">
              Platform Access
            </div>
            <div className="text-xs text-white/30 mt-1">
              Authorized personnel only
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/50 transition"
              />
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/50 transition"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition disabled:opacity-50"
            >
              {loading ? '...' : 'Access'}
            </button>
          </form>
        </div>

        {/* Link de volta discreto */}
        <div className="text-center mt-6">
          <a href="/" className="text-white/20 text-xs hover:text-white/40 transition">
            ← crmplus.pt
          </a>
        </div>
      </div>
    </div>
  );
}
