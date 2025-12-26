"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { MortgageSimulator } from "./MortgageSimulator";
import { TaxCalculator } from "./TaxCalculator";
import { CompareButton } from "./CompareButton";
import { CompareProperty } from "@/contexts/CompareContext";

interface PropertyToolsProps {
  property: CompareProperty;
  price: number;
}

export function PropertyTools({ property, price }: PropertyToolsProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [showTaxCalc, setShowTaxCalc] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Comparar */}
        <CompareButton property={property} size="md" />

        {/* Simular Prestação */}
        <button
          onClick={() => setShowSimulator(true)}
          className="flex items-center gap-2 rounded-full bg-[#2A2A2E] px-4 py-2 text-sm text-white transition hover:bg-[#E10600]"
          title="Simular Prestação"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline">Simular Prestação</span>
        </button>

        {/* Calcular IMT */}
        <button
          onClick={() => setShowTaxCalc(true)}
          className="flex items-center gap-2 rounded-full bg-[#2A2A2E] px-4 py-2 text-sm text-white transition hover:bg-[#E10600]"
          title="Calcular IMT"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden sm:inline">Calcular IMT</span>
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
    </>
  );
}
