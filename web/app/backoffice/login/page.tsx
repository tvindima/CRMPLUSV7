'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BackofficeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Falha na autenticação");
      }
      router.push("/backoffice/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-8 shadow-2xl shadow-[#E10600]/15">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#E10600]">Backoffice</p>
          <h1 className="text-2xl font-semibold">Login Staff</h1>
          <p className="text-sm text-[#C5C5C5]">Acesso reservado a colaboradores CRM PLUS.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-[#C5C5C5]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-sm outline-none focus:border-[#E10600]"
              placeholder="tvindima@imoveismais.pt"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#C5C5C5]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#0B0B0D] px-3 py-2 text-sm outline-none focus:border-[#E10600]"
              placeholder="••••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#E10600] to-[#a10600] px-4 py-2 text-sm font-semibold shadow-[0_0_12px_rgba(225,6,0,0.6)] transition hover:shadow-[0_0_18px_rgba(225,6,0,0.8)] disabled:opacity-60"
          >
            {loading ? "A autenticar..." : "Entrar"}
          </button>
        </form>
        <div className="flex justify-between text-sm text-[#C5C5C5]">
          <Link href="/" className="text-[#E10600] hover:underline">
            Voltar ao site público
          </Link>
          <Link href="/backoffice/errors/forbidden" className="hover:underline">
            Precisas de ajuda?
          </Link>
        </div>
      </div>
    </div>
  );
}
