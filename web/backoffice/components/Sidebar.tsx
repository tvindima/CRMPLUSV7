'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "../context/roleContext";
import { BrandImage } from "../../components/BrandImage";
import { useState } from "react";

// Menu simplificado para ÁREA DE CLIENTE (não é backoffice de gestão)
const links = [
  { href: "/backoffice/dashboard", label: "Painel inicial", roles: ["client", "agent", "leader", "admin", "staff"] },
  { href: "/backoffice/favoritos", label: "Favoritos", roles: ["client"] },
  { href: "/backoffice/pesquisas", label: "Pesquisas Guardadas", roles: ["client"] },
  { href: "/backoffice/visitas", label: "Minhas Visitas", roles: ["client"] },
  { href: "/backoffice/propostas", label: "Minhas Propostas", roles: ["client"] },
  { href: "/backoffice/perfil", label: "Meu Perfil", roles: ["client", "agent", "leader", "admin", "staff"] },
];

const iconCircle = (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F10] text-xs text-[#E10600]">•</span>
);

export function Sidebar() {
  const { role, isAuthenticated } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <aside className="hidden w-64 flex-shrink-0 border-r border-[#1F1F22] bg-[#0F0F10] p-5 md:block">
        <p className="text-sm text-[#C5C5C5]">Sessão em validação...</p>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-[#1F1F22] bg-[#0F0F10] p-5 md:block">
      <div className="flex items-center gap-2 pb-8">
        <BrandImage src="/brand/logoCRMPLUSS.png" alt="Logo" width={36} height={36} />
        <span className="text-xl font-semibold text-white">Área Cliente</span>
      </div>

      <div className="space-y-1">
        {links
          .filter((l) => l.roles.includes(role))
          .map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                  active ? "bg-[#111113] text-white" : "text-[#C5C5C5] hover:bg-[#0B0B0D]"
                }`}
              >
                {iconCircle}
                <span>{link.label}</span>
              </Link>
            );
          })}
      </div>

      {/* Logout button */}
      <div className="mt-8 pt-8 border-t border-[#1F1F22]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#C5C5C5] hover:bg-[#0B0B0D] disabled:opacity-50"
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F10] text-xs text-[#E10600]">↪</span>
          <span>{loggingOut ? 'A sair...' : 'Terminar sessão'}</span>
        </button>
      </div>
    </aside>
  );
}
