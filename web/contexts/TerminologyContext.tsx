'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getTenantSlugFromCookie, getApiUrl } from '@/lib/tenant';
import { Terminology, Sector, getTerminology, replaceAgencyName } from '@/lib/terminology';
import { useBranding } from './BrandingContext';

interface TenantConfig {
  sector: Sector;
  name: string;
}

interface TerminologyContextType {
  terms: Terminology;
  sector: Sector;
  loading: boolean;
}

const defaultTerms = getTerminology('real_estate');

const TerminologyContext = createContext<TerminologyContextType>({
  terms: defaultTerms,
  sector: 'real_estate',
  loading: true,
});

export function TerminologyProvider({ children }: { children: ReactNode }) {
  const [sector, setSector] = useState<Sector>('real_estate');
  const [loading, setLoading] = useState(true);
  const { branding } = useBranding();

  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        const apiUrl = getApiUrl();
        const tenantSlug = getTenantSlugFromCookie();
        
        if (!apiUrl || !tenantSlug) {
          setLoading(false);
          return;
        }
        
        // Buscar config do tenant para obter o sector
        const response = await fetch(`${apiUrl}/platform/tenants/by-slug/${tenantSlug}`, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.sector) {
            setSector(data.sector as Sector);
          }
        }
      } catch (error) {
        console.error('Failed to fetch tenant config for terminology:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantConfig();
  }, []);

  // Obter terminologia baseada no sector e substituir {agency_name}
  const baseTerms = getTerminology(sector);
  const terms: Terminology = {
    ...baseTerms,
    teamSubtitle: replaceAgencyName(baseTerms.teamSubtitle, branding.agency_name),
  };

  return (
    <TerminologyContext.Provider value={{ terms, sector, loading }}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminology() {
  return useContext(TerminologyContext);
}
