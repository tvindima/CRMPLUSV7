'use client';

import { useEffect } from 'react';
import { useBranding } from '@/contexts/BrandingContext';

export function DynamicTitle() {
  const { branding, loading } = useBranding();

  useEffect(() => {
    if (!loading && branding.agency_name) {
      // Atualizar título do documento - usa o slogan ou apenas o nome
      const defaultTitle = branding.agency_slogan 
        ? `${branding.agency_name} - ${branding.agency_slogan}`
        : branding.agency_name;
      document.title = defaultTitle;
    }
  }, [branding, loading]);

  return null; // Componente invisível
}
