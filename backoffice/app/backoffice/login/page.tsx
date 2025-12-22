'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "/";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#05060f] via-[#07091c] to-[#040510] px-4 text-white">
      {/* Halos de fundo */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#4b9dff]/25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-[#7c3aed]/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-16 h-96 w-96 rounded-full bg-[#ff4d7a]/20 blur-[180px]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-lg rounded-[26px] border border-[#4bc2ff]/25 bg-gradient-to-br from-[#0b0f1a]/85 via-[#0c0f19]/80 to-[#090a12]/90 p-[1px] shadow-[0_35px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <div className="relative overflow-hidden rounded-[24px] bg-[#0a0c14]/90 p-8 md:p-10">
          <div className="pointer-events-none absolute -left-10 -top-12 h-52 w-52 rounded-full bg-[#3b82f6]/30 blur-[110px]" />
          <div className="pointer-events-none absolute -right-6 bottom-0 h-48 w-48 rounded-full bg-[#ff4d7a]/25 blur-[120px]" />
          <div className="relative space-y-6">
            <div className="space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.22em] text-[#4bc2ff]">CRM PLUS</p>
              <h1 className="text-3xl font-semibold leading-tight">Welcome to the Next Generation Tools</h1>
              <p className="text-sm text-[#C5C5C5]">for Real Estate — acesso reservado a staff/admin.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm text-[#C5C5C5]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={clsx(
                    "w-full rounded-xl border border-[#1f2a3d] bg-[#0d111c]/80 px-4 py-3 text-sm text-white",
                    "shadow-[0_12px_35px_rgba(59,130,246,0.18)] outline-none transition",
                    "focus:border-[#4bc2ff] focus:shadow-[0_12px_35px_rgba(75,194,255,0.35)]",
                  )}
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
                  className={clsx(
                    "w-full rounded-xl border border-[#1f2a3d] bg-[#0d111c]/80 px-4 py-3 text-sm text-white",
                    "shadow-[0_12px_35px_rgba(124,58,237,0.18)] outline-none transition",
                    "focus:border-[#7c3aed] focus:shadow-[0_12px_35px_rgba(124,58,237,0.35)]",
                  )}
                  placeholder="••••••••••"
                />
              </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-[#4b9dff] via-[#7c3aed] to-[#ff4d7a] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(75,157,255,0.35)] transition disabled:opacity-60"
              >
                {loading ? "A autenticar..." : "Entrar"}
              </motion.button>
            </form>

            <div className="flex flex-col items-center justify-between gap-2 text-sm text-[#C5C5C5] md:flex-row">
              <Link
                href={PUBLIC_SITE_URL}
                className="text-[#4bc2ff] underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4bc2ff]"
                aria-label="Voltar ao site público"
              >
                Voltar ao site público
              </Link>
              <Link href="/backoffice/errors/forbidden" className="hover:underline">
                Precisas de ajuda?
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
