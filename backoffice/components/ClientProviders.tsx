'use client';

import { ReactNode } from 'react';
import { RoleProvider } from '../context/roleContext';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      {children}
    </RoleProvider>
  );
}
