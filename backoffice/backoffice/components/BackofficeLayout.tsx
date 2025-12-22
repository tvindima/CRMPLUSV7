'use client';

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { RoleProvider } from "../context/roleContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export function BackofficeLayout({ title, children, showBackButton = false }: { title: string; children: ReactNode; showBackButton?: boolean }) {
  const router = useRouter();

  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-[#060607] text-white">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 space-y-6 bg-[#060607] p-6">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={() => router.push('/backoffice/dashboard')}
                  className="flex items-center gap-2 rounded-lg bg-[#1F1F22] px-3 py-2 text-sm text-white transition-colors hover:bg-[#2A2A2E]"
                  title="Voltar ao Dashboard"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}
              <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
            </div>
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
