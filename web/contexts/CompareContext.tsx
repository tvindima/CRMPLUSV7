"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CompareProperty {
  id: number;
  referencia: string;
  titulo?: string;
  preco: number;
  tipologia?: string;
  area_util?: number;
  area_bruta?: number;
  quartos?: number;
  casas_banho?: number;
  localizacao?: string;
  imagem?: string;
  tipo_negocio?: string;
  tipo_imovel?: string;
  ano_construcao?: number;
  certificado_energetico?: string;
  garagem?: boolean;
  varanda?: boolean;
  piscina?: boolean;
  jardim?: boolean;
}

interface CompareContextType {
  compareList: CompareProperty[];
  addToCompare: (property: CompareProperty) => boolean;
  removeFromCompare: (id: number) => void;
  clearCompare: () => void;
  isInCompare: (id: number) => boolean;
  canAddMore: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE = 5;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<CompareProperty[]>([]);

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem("compareList");
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch {
        localStorage.removeItem("compareList");
      }
    }
  }, []);

  // Guardar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("compareList", JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (property: CompareProperty): boolean => {
    if (compareList.length >= MAX_COMPARE) {
      return false;
    }
    if (compareList.some((p) => p.id === property.id)) {
      return false;
    }
    setCompareList((prev) => [...prev, property]);
    return true;
  };

  const removeFromCompare = (id: number) => {
    setCompareList((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (id: number) => {
    return compareList.some((p) => p.id === id);
  };

  const canAddMore = compareList.length < MAX_COMPARE;

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return context;
}
