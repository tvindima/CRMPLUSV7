'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "../context/roleContext";
import { useState, useEffect } from "react";

// Menu ÁREA DE CLIENTE no site web
const links = [
  { href: "/backoffice/favoritos", label: "Os meus favoritos", icon: "❤️" },
  { href: "/backoffice/comparar", label: "Comparar imóveis", icon: "📊" },
  { href: "/backoffice/pesquisas", label: "Pesquisas guardadas", icon: "🔍" },
  { href: "/backoffice/alertas", label: "Alertas de imóveis", icon: "🔔" },
];

const ferramentas = [
  { href: "/backoffice/simulador", label: "Simulador de Prestação", icon: "🏠" },
  { href: "/backoffice/calculadora-imt", label: "Calculadora de IMT", icon: "🧮" },
];

export function Sidebar() {
  const { role, isAuthenticated } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Tentar obter dados do utilizador do localStorage ou session
    const storedName = localStorage.getItem('userName') || 'Cliente';
    const storedEmail = localStorage.getItem('userEmail') || '';
    setUserName(storedName);
    setUserEmail(storedEmail);
  }, []);

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
      {/* User Info */}
      <div className="pb-6 border-b border-[#1F1F22]">
        <p className="text-white font-semibold">{userName}</p>
        <p className="text-xs text-[#888]">{userEmail}</p>
      </div>

      {/* Menu principal */}
      <div className="space-y-1 py-4">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                active ? "bg-[#111113] text-white" : "text-[#C5C5C5] hover:bg-[#0B0B0D]"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Ferramentas */}
      <div className="py-4 border-t border-[#1F1F22]">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#666]">
          Ferramentas
        </p>
        <div className="space-y-1">
          {ferramentas.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                  active ? "bg-[#111113] text-white" : "text-[#C5C5C5] hover:bg-[#0B0B0D]"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout button */}
      <div className="pt-4 border-t border-[#1F1F22]">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#E10600] hover:bg-[#0B0B0D] disabled:opacity-50"
        >
          <span>↪</span>
          <span>{loggingOut ? 'A sair...' : 'Terminar sessão'}</span>
        </button>
      </div>
    </aside>
  );
}
