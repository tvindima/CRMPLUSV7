'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "../context/roleContext";
import { useTenant } from "../context/TenantContext";
import { useTerminology } from "../context/TerminologyContext";
import { BrandImage } from "@/components/BrandImage";
import { useState, useMemo } from "react";

// Função para obter links com terminologia dinâmica
function getLinks(term: (key: string, fallback?: string) => string, sector: string) {
  // Label para "Visitas" varia por sector
  const visitLabel = sector === 'automotive' ? 'Test Drives' : 
                     sector === 'services' ? 'Reuniões' : 
                     sector === 'retail' ? 'Atendimentos' : 
                     sector === 'hospitality' ? 'Reservas' : 'Visitas';
  
  // Label para "Pré-Angariações" varia por sector                   
  const preAngLabel = sector === 'automotive' ? 'Pré-Avaliações' : 
                      sector === 'real_estate' ? 'Pré-Angariações' : 
                      'Pré-Registos';
  
  return [
    { href: "/backoffice/dashboard", label: "Painel inicial", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/properties", label: term('items', 'Propriedades'), roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/leads", label: "Leads", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/clients", label: "Clientes", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/website-clients", label: "Clientes Website", roles: ["leader", "admin", "staff"] },
    { href: "/backoffice/opportunities", label: "Oportunidades", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/visits", label: visitLabel, roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/proposals", label: "Propostas", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/agenda", label: "Agenda", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/pre-angariacoes", label: preAngLabel, roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/escrituras", label: "📜 Escrituras", roles: ["agent", "leader", "admin", "staff"] },
    { href: "/backoffice/reports", label: "Relatórios", roles: ["leader", "admin", "staff"] },
    // Secção GESTÃO
    { href: "/backoffice/agents", label: "Agentes", roles: ["leader", "admin", "staff"], isManagement: true },
    { href: "/backoffice/teams", label: "Equipas", roles: ["leader", "admin", "staff"], isManagement: true },
    { href: "/backoffice/users", label: "Utilizadores", roles: ["admin", "staff"], isManagement: true },
    { href: "/backoffice/config/branding", label: "🎨 Branding Site", roles: ["admin", "staff"], isManagement: true },
    { href: "/backoffice/config/watermark", label: "💧 Marca de Água", roles: ["admin", "staff"], isManagement: true },
    { href: "/backoffice/config", label: "⚙️ Configurações", roles: ["admin", "staff"], isManagement: true },
  ];
}

const iconCircle = (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F10] text-xs text-[#E10600]">•</span>
);

export function Sidebar() {
  const { role, isAuthenticated } = useRole();
  const { sector } = useTenant();
  const { term } = useTerminology();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Memoizar links para evitar recalcular em cada render
  const links = useMemo(() => getLinks(term, sector), [term, sector]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // FIXED: Usar proxy route com tenant isolation
      await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      // Redirect to login
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
                const isSubItem = (link as any).isSubItem;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                      isSubItem ? 'ml-6 text-xs' : ''
                    } ${
                      active ? "bg-[#111113] text-white" : "text-[#C5C5C5] hover:bg-[#0B0B0D]"
                    }`}
                  >
                    {!isSubItem && iconCircle}
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
