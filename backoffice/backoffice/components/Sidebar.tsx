'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "../context/roleContext";
import { BrandImage } from "../../components/BrandImage";
import { useState } from "react";

const links = [
  { href: "/backoffice/dashboard", label: "Painel inicial", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/properties", label: "Propriedades", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/leads", label: "Leads", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/clients", label: "Clientes", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/website-clients", label: "Clientes Website", roles: ["leader", "admin", "staff", "coordinator"] },
  { href: "/backoffice/opportunities", label: "Oportunidades", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/visits", label: "Visitas", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/proposals", label: "Propostas", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/agenda", label: "Agenda", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/pre-angariacoes", label: "Pré-Angariações", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/escrituras", label: "📜 Escrituras", roles: ["agent", "leader", "admin", "staff", "coordinator", "assistant"] },
  { href: "/backoffice/reports", label: "Relatórios", roles: ["leader", "admin", "staff", "coordinator"] },
  // Secção GESTÃO
  { href: "/backoffice/agents", label: "Agentes", roles: ["leader", "admin", "staff", "coordinator"], isManagement: true },
  { href: "/backoffice/teams", label: "Equipas", roles: ["leader", "admin", "staff", "coordinator"], isManagement: true },
  { href: "/backoffice/users", label: "Utilizadores", roles: ["admin", "staff"], isManagement: true },
  { href: "/backoffice/config/branding", label: "🎨 Branding Site", roles: ["admin", "staff"], isManagement: true },
  { href: "/backoffice/config/watermark", label: "💧 Marca de Água", roles: ["admin", "staff"], isManagement: true },
  { href: "/backoffice/config", label: "⚙️ Configurações", roles: ["admin", "staff"], isManagement: true },
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
      router.push('/login');
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
        <BrandImage src="/brand/logoCRMPLUSS.png" alt="CRM PLUS" width={36} height={36} />
        <span className="text-xl font-semibold text-white">CRM</span>
      </div>

      <div className="space-y-6">
        {/* Menu principal */}
        <div className="space-y-1">
          {links
            .filter((l) => l.roles.includes(role) && !l.isManagement)
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

        {/* Secção GESTÃO */}
        {links.some((l) => l.isManagement && l.roles.includes(role)) && (
          <div className="space-y-1">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#666]">
              Gestão
            </p>
            {links
              .filter((l) => l.roles.includes(role) && l.isManagement)
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
        )}
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
