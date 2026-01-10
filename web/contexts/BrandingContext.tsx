'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTenantSlugFromCookie, getApiUrl } from '@/lib/tenant';

interface Branding {
  agency_name: string;
  agency_logo_url: string;
  agency_slogan: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  background_secondary: string;
  text_color: string;
  text_muted: string;
  border_color: string;
  accent_color: string;
}

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
}

// Defaults CRM Plus - serão substituídos pelos valores da API do tenant
const defaultBranding: Branding = {
  agency_name: 'CRM Plus',
  agency_logo_url: '', // Deixar vazio para usar fallback do componente
  agency_slogan: 'O seu negócio, simplificado',
  primary_color: '#E10600',
  secondary_color: '#C5C5C5',
  background_color: '#0B0B0D',
  background_secondary: '#1A1A1F',
  text_color: '#FFFFFF',
  text_muted: '#9CA3AF',
  border_color: '#2A2A2E',
  accent_color: '#E10600',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
});

// Função para aplicar CSS variables ao document
function applyThemeColors(branding: Branding) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-primary', branding.primary_color);
  root.style.setProperty('--color-secondary', branding.secondary_color);
  root.style.setProperty('--color-background', branding.background_color);
  root.style.setProperty('--color-background-secondary', branding.background_secondary);
  root.style.setProperty('--color-text', branding.text_color);
  root.style.setProperty('--color-text-muted', branding.text_muted);
  root.style.setProperty('--color-border', branding.border_color);
  root.style.setProperty('--color-accent', branding.accent_color);
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const apiUrl = getApiUrl();
        const tenantSlug = getTenantSlugFromCookie();
        
        if (!apiUrl) {
          console.warn('No API URL configured for branding');
          setLoading(false);
          return;
        }
        
        // Usar endpoint público com header do tenant
        const response = await fetch(`${apiUrl}/public/branding`, {
          headers: {
            'X-Tenant-Slug': tenantSlug,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const newBranding = {
            agency_name: data.agency_name || defaultBranding.agency_name,
            agency_logo_url: data.agency_logo_url || defaultBranding.agency_logo_url,
            agency_slogan: data.agency_slogan || defaultBranding.agency_slogan,
            primary_color: data.primary_color || defaultBranding.primary_color,
            secondary_color: data.secondary_color || defaultBranding.secondary_color,
            background_color: data.background_color || defaultBranding.background_color,
            background_secondary: data.background_secondary || defaultBranding.background_secondary,
            text_color: data.text_color || defaultBranding.text_color,
            text_muted: data.text_muted || defaultBranding.text_muted,
            border_color: data.border_color || defaultBranding.border_color,
            accent_color: data.accent_color || defaultBranding.accent_color,
          };
          setBranding(newBranding);
          applyThemeColors(newBranding);
        }
      } catch (error) {
        console.error('Failed to fetch branding settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  // Aplicar cores quando branding muda
  useEffect(() => {
    applyThemeColors(branding);
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
