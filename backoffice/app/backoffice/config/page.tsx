'use client';

import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider } from "../../../backoffice/components/ToastProvider";
import Link from "next/link";
import { 
  Cog6ToothIcon, 
  PhotoIcon, 
  UserGroupIcon,
  BuildingOfficeIcon,
  BellIcon 
} from "@heroicons/react/24/outline";

const configSections = [
  {
    title: "Marca de Água",
    description: "Configurar watermark para imagens dos imóveis",
    href: "/backoffice/config/watermark",
    icon: PhotoIcon,
  },
  {
    title: "Utilizadores",
    description: "Gerir utilizadores e permissões",
    href: "/backoffice/users",
    icon: UserGroupIcon,
  },
  {
    title: "Agentes",
    description: "Gerir agentes e equipas",
    href: "/backoffice/agents",
    icon: BuildingOfficeIcon,
  },
];

export default function ConfigPage() {
  return (
    <ToastProvider>
      <BackofficeLayout title="Configurações">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-xl border border-[#23232B] bg-[#0F0F12] p-6 transition-all hover:border-[#E10600]/30 hover:bg-[#111113]"
            >
              <section.icon className="h-8 w-8 text-[#E10600] mb-4" />
              <h3 className="font-medium text-white group-hover:text-[#E10600]">
                {section.title}
              </h3>
              <p className="mt-1 text-sm text-[#999]">{section.description}</p>
            </Link>
          ))}
        </div>
      </BackofficeLayout>
    </ToastProvider>
  );
}
