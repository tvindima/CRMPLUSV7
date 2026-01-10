'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TenantConfig {
  id: number;
  slug: string;
  name: string;
  sector: string;
  plan: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  features: string[];
  max_agents: number;
  max_properties: number;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  sector: string;
  loading: boolean;
  isRealEstate: boolean;
  isAutomotive: boolean;
  isServices: boolean;
  isRetail: boolean;
  isHospitality: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_TENANT: TenantConfig = {
  id: 0,
  slug: 'default',
  name: 'CRM Plus',
  sector: 'real_estate',
  plan: 'basic',
  primary_color: '#E10600',
  secondary_color: '#C5C5C5',
  logo_url: null,
  features: [],
  max_agents: 10,
  max_properties: 100,
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async () => {
    try {
      // Obtém config do tenant via API route do Next.js
      const response = await fetch('/api/tenant/config');
      if (response.ok) {
        const data = await response.json();
        setTenant(data);
      } else {
        // Fallback para tenant default (imobiliário)
        setTenant(DEFAULT_TENANT);
      }
    } catch (error) {
      console.error('Error fetching tenant config:', error);
      setTenant(DEFAULT_TENANT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const sector = tenant?.sector || 'real_estate';

  return (
    <TenantContext.Provider
      value={{
        tenant,
        sector,
        loading,
        isRealEstate: sector === 'real_estate',
        isAutomotive: sector === 'automotive',
        isServices: sector === 'services',
        isRetail: sector === 'retail',
        isHospitality: sector === 'hospitality',
        refresh: fetchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    // Retornar valores default se usado fora do provider
    return {
      tenant: DEFAULT_TENANT,
      sector: 'real_estate',
      loading: false,
      isRealEstate: true,
      isAutomotive: false,
      isServices: false,
      isRetail: false,
      isHospitality: false,
      refresh: async () => {},
    };
  }
  return context;
}
