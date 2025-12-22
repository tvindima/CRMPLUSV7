'use client';

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { RoleProvider } from "../context/roleContext";

export function BackofficeLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-[#060607] text-white">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 space-y-6 bg-[#060607] p-6">
            <h1 className="text-3xl font-semibold">{title}</h1>
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
