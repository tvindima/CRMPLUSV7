"use client";

import { useCompare, CompareProperty } from "@/contexts/CompareContext";
import { useState } from "react";

interface CompareButtonProps {
  property: CompareProperty;
  size?: "sm" | "md";
  className?: string;
}

export function CompareButton({ property, size = "sm", className = "" }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  const [showTooltip, setShowTooltip] = useState(false);
  
  const inCompare = isInCompare(property.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        className={`flex items-center justify-center rounded-full transition ${sizeClasses} ${
          inCompare
            ? "bg-[#E10600] text-white"
            : "bg-black/50 text-white hover:bg-[#E10600] backdrop-blur"
        } ${className}`}
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

      {/* Tooltip de erro */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-red-500 px-3 py-1.5 text-xs text-white shadow-lg">
          Máximo 5 imóveis
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500" />
        </div>
      )}
    </div>
  );
}
