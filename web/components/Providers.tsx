"use client";

import { ReactNode } from "react";
import { CompareProvider } from "@/contexts/CompareContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { TerminologyProvider } from "@/contexts/TerminologyContext";
import { CompareFloatingBar } from "./CompareFloatingBar";
import type { Branding } from "@/contexts/BrandingContext";

export function Providers({
  children,
  initialBranding,
}: {
  children: ReactNode;
  initialBranding?: Branding;
}) {
  return (
    <BrandingProvider initialBranding={initialBranding}>
      <TerminologyProvider>
        <AuthProvider>
          <CompareProvider>
            {children}
            <CompareFloatingBar />
          </CompareProvider>
        </AuthProvider>
      </TerminologyProvider>
    </BrandingProvider>
  );
}
