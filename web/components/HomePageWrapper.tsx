"use client";

import { ReactNode, useEffect } from "react";
import { useBranding } from "@/contexts/BrandingContext";

interface HomePageWrapperProps {
  children: ReactNode;
}

export function HomePageWrapper({ children }: HomePageWrapperProps) {
  const { branding } = useBranding();

  // Atualizar título da homepage com o nome do tenant
  useEffect(() => {
    if (branding.agency_name && branding.agency_name !== 'A carregar...') {
      document.title = branding.agency_name;
    }
  }, [branding.agency_name]);

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
      }}
    >
      {children}
    </div>
  );
}
