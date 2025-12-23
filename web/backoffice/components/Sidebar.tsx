'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "../context/roleContext";
import { BrandImage } from "../../components/BrandImage";
import { useState } from "react";

const links = [
  { href: "/backoffice/dashboard", label: "Painel inicial", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/imoveis", label: "Propriedades", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/leads", label: "Leads", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/agenda", label: "Visitas", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/agentes", label: "Angariações", roles: ["leader", "admin", "staff"] },
  { href: "/backoffice/feeds", label: "Feeds", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/config", label: "Configurações", roles: ["admin", "leader", "agent", "staff"] },
];

// Atalhos rápidos (quick actions) - só para admin/staff
const quickActions = [
  { href: "/backoffice/agentes/novo", label: "RH+", title: "Novo Membro Staff", icon: "👤", roles: ["admin", "staff"] },
  { href: "/backoffice/imoveis/novo", label: "Imóvel+", title: "Novo Imóvel", icon: "🏠", roles: ["admin", "staff", "agent"] },
];

const iconCircle = (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F10] text-xs text-[#E10600]">•</span>
);

export function Sidebar() {
  const { role, isAuthenticated } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <aside className="hidden w-64 flex-shrink-0 border-r border-[#1F1F22] bg-[#0F0F10] p-5 md:block">
        <p className="text-sm text-[#C5C5C5]">Sessão em validação...</p>
      </aside>
    );
  }

  const availableQuickActions = quickActions.filter((a) => a.roles.includes(role));

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-[#1F1F22] bg-[#0F0F10] p-5 md:block">
      <div className="flex items-center gap-2 pb-8">
        <BrandImage src="/brand/logoCRMPLUSS.png" alt="CRM PLUS" width={36} height={36} />
        <span className="text-xl font-semibold text-white">CRM</span>
      </div>

      {/* Quick Actions / Atalhos */}
      {availableQuickActions.length > 0 && (
        <div className="mb-6 pb-4 border-b border-[#1F1F22]">
          <p className="text-xs text-[#888] uppercase tracking-wider mb-3">Atalhos</p>
          <div className="flex flex-wrap gap-2">
            {availableQuickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                title={action.title}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-[#E10600]/20 to-[#E10600]/10 border border-[#E10600]/30 text-white text-xs font-medium hover:from-[#E10600]/30 hover:to-[#E10600]/20 transition-all"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

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
    </aside>
  );
}
