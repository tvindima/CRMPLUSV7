"use client";

import { ReactNode } from "react";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareFloatingBar } from "./CompareFloatingBar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CompareProvider>
      {children}
      <CompareFloatingBar />
    </CompareProvider>
  );
}
