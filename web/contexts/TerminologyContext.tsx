'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Terminology, Sector, getTerminology, replaceAgencyName } from '@/lib/terminology';
import { useBranding } from './BrandingContext';

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
  const { branding, loading: brandingLoading } = useBranding();
  const [loading, setLoading] = useState(true);

  // Usar sector do branding (vem junto na mesma chamada API)
  const sector = (branding.sector as Sector) || 'real_estate';

  useEffect(() => {
    // Quando branding carrega, terminologia também está pronta
    if (!brandingLoading) {
      setLoading(false);
    }
  }, [brandingLoading]);

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
