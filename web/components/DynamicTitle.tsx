'use client';

import { useEffect } from 'react';
import { useBranding } from '@/contexts/BrandingContext';

export function DynamicTitle() {
  const { branding, loading } = useBranding();

  useEffect(() => {
    if (!loading && branding.agency_name) {
      // Atualizar título do documento
      const defaultTitle = `${branding.agency_name} - ${branding.agency_slogan || 'Imobiliária'}`;
      document.title = defaultTitle;
    }
  }, [branding, loading]);

  return null; // Componente invisível
}
