'use client';

import { ReactNode } from 'react';
import { RoleProvider } from '../context/roleContext';
import { TenantProvider, useTenant } from '../context/TenantContext';
import { TerminologyProvider } from '../context/TerminologyContext';

// Wrapper interno para passar o sector do TenantContext para o TerminologyProvider
function InnerProviders({ children }: { children: ReactNode }) {
  const { sector } = useTenant();
  
  return (
    <TerminologyProvider sector={sector}>
      <RoleProvider>
        {children}
      </RoleProvider>
    </TerminologyProvider>
  );
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <TenantProvider>
      <InnerProviders>
        {children}
      </InnerProviders>
    </TenantProvider>
  );
}
