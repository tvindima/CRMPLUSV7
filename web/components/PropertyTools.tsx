"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { MortgageSimulator } from "./MortgageSimulator";
import { TaxCalculator } from "./TaxCalculator";
import { CompareButton } from "./CompareButton";
import { LoginPromptModal } from "./LoginPromptModal";
import { CompareProperty } from "@/contexts/CompareContext";
import { useAuth } from "@/contexts/AuthContext";

interface PropertyToolsProps {
  property: CompareProperty;
  price: number;
}

export function PropertyTools({ property, price }: PropertyToolsProps) {
  const { isAuthenticated } = useAuth();
  const [showSimulator, setShowSimulator] = useState(false);
  const [showTaxCalc, setShowTaxCalc] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingTool, setPendingTool] = useState<string>("");

  const handleToolClick = (tool: "simulator" | "tax") => {
    if (!isAuthenticated) {
      setPendingTool(tool === "simulator" ? "Simulador de Prestação" : "Calculadora de IMT");
      setShowLoginPrompt(true);
      return;
    }
    
    if (tool === "simulator") {
      setShowSimulator(true);
    } else {
      setShowTaxCalc(true);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Comparar */}
        <CompareButton property={property} size="md" />

        {/* Simular Prestação */}
        <button
          onClick={() => handleToolClick("simulator")}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
          style={{
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          title="Simular Prestação"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">Simular Prestação</span>
          {!isAuthenticated && (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-primary)' }}>
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Calcular IMT */}
        <button
          onClick={() => handleToolClick("tax")}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition"
          style={{
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
          title="Calcular IMT"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Calcular IMT</span>
          {!isAuthenticated && (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-primary)' }}>
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Modal Simulador */}
      {showSimulator && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowSimulator(false)}
        >
          <div className="w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
            <MortgageSimulator valorImovel={price} onClose={() => setShowSimulator(false)} />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Calculadora IMT */}
      {showTaxCalc && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowTaxCalc(false)}
        >
          <div className="w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
            <TaxCalculator valorImovel={price} onClose={() => setShowTaxCalc(false)} />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Login Prompt */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        toolName={pendingTool}
      />
    </>
  );
}
