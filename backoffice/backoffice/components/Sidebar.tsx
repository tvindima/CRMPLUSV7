'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "../context/roleContext";
import { BrandImage } from "../../components/BrandImage";

const links = [
  { href: "/backoffice/dashboard", label: "Painel inicial", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/properties", label: "Imóveis", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/leads", label: "Leads", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/agents", label: "Agentes", roles: ["leader", "admin", "staff"] },
  { href: "/backoffice/teams", label: "Equipas", roles: ["leader", "admin", "staff"] },
  { href: "/backoffice/agenda", label: "Agenda", roles: ["agent", "leader", "admin", "staff"] },
  { href: "/backoffice/reports", label: "Relatórios", roles: ["leader", "admin", "staff"] },
  { href: "/backoffice/config", label: "Configurações", roles: ["admin", "staff"] },
];

const iconCircle = (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F10] text-xs text-[#E10600]">•</span>
);

export function Sidebar() {
  const { role, isAuthenticated } = useRole();
  const pathname = usePathname();

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
