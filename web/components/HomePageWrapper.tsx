"use client";

import { ReactNode } from "react";

interface HomePageWrapperProps {
  children: ReactNode;
}

export function HomePageWrapper({ children }: HomePageWrapperProps) {
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
