"use client";

import { useCompare, CompareProperty } from "@/contexts/CompareContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTerminology } from "@/contexts/TerminologyContext";
import { useState } from "react";
import { LoginPromptModal } from "./LoginPromptModal";

interface CompareButtonProps {
  property: CompareProperty;
  size?: "sm" | "md";
  className?: string;
}

export function CompareButton({ property, size = "sm", className = "" }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  const { isAuthenticated } = useAuth();
  const { terms } = useTerminology();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const inCompare = isInCompare(property.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Verificar autenticação primeiro
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (inCompare) {
      removeFromCompare(property.id);
    } else {
      if (!canAddMore) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
        return;
      }
      addToCompare(property);
    }
  };

  const sizeClasses = size === "sm" 
    ? "h-8 w-8" 
    : "h-10 w-10";

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex items-center justify-center rounded-full transition ${sizeClasses} ${className}`}
        style={{
          backgroundColor: inCompare ? 'var(--color-primary)' : 'rgba(0, 0, 0, 0.5)',
          color: 'var(--color-text)',
        }}
        title={inCompare ? "Remover da comparação" : "Adicionar à comparação"}
      >
        <svg 
          className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} 
          fill={inCompare ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" 
          />
        </svg>
      </button>

      {/* Ícone de cadeado para não autenticados */}
      {!isAuthenticated && (
        <div 
          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Tooltip de erro */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-red-500 px-3 py-1.5 text-xs text-white shadow-lg">
          Máximo 5 {terms.items}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500" />
        </div>
      )}

      {/* Modal Login Prompt */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        toolName={`Comparador de ${terms.itemsCapitalized}`}
      />
    </div>
  );
}
