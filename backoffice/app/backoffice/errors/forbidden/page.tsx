'use client';

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#050506] text-white flex items-center justify-center px-4">
      <div className="max-w-xl space-y-4 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-8 text-center shadow-2xl shadow-[#E10600]/15">
        <p className="text-sm uppercase tracking-[0.2em] text-[#E10600]">403</p>
        <h1 className="text-3xl font-semibold">Acesso proibido</h1>
        <p className="text-sm text-[#C5C5C5]">Área reservada a staff/admin. Faz login com credenciais válidas para continuar.</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-full border border-[#2A2A2E] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#E10600]"
          >
            Ir para o site público
          </Link>
          <Link
            href="/backoffice/login"
            className="rounded-full bg-gradient-to-r from-[#E10600] to-[#a10600] px-4 py-2 text-sm font-semibold shadow-[0_0_12px_rgba(225,6,0,0.6)]"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
