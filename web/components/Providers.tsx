"use client";

import { ReactNode } from "react";
import { CompareProvider } from "@/contexts/CompareContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { CompareFloatingBar } from "./CompareFloatingBar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BrandingProvider>
      <AuthProvider>
        <CompareProvider>
          {children}
          <CompareFloatingBar />
        </CompareProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}
