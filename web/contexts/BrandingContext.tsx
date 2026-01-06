'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Branding {
  agency_name: string;
  agency_logo_url: string;
  agency_slogan: string;
  primary_color: string;
}

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
}

// Defaults genéricos - serão substituídos pelos valores da API
const defaultBranding: Branding = {
  agency_name: 'Imóveis Mais',
  agency_logo_url: '/brand/agency-logo.svg',
  agency_slogan: 'Casas e investimentos à medida',
  primary_color: '#E10600',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        // Usa a variável de ambiente do tenant actual
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
        
        if (!apiUrl) {
          console.warn('No API URL configured for branding');
          setLoading(false);
          return;
        }
        
        // Usar endpoint público (sem autenticação)
        const response = await fetch(`${apiUrl}/public/branding`);
        
        if (response.ok) {
          const data = await response.json();
          setBranding({
            agency_name: data.agency_name || defaultBranding.agency_name,
            agency_logo_url: data.agency_logo_url || defaultBranding.agency_logo_url,
            agency_slogan: data.agency_slogan || defaultBranding.agency_slogan,
            primary_color: data.primary_color || defaultBranding.primary_color,
          });
        }
      } catch (error) {
        console.error('Failed to fetch branding settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
