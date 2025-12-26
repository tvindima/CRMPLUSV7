"use client";

import { ReactNode } from "react";
import { CompareProvider } from "@/contexts/CompareContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompareFloatingBar } from "./CompareFloatingBar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CompareProvider>
        {children}
        <CompareFloatingBar />
      </CompareProvider>
    </AuthProvider>
  );
}
