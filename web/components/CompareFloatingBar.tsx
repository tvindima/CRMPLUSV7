"use client";

import { useCompare } from "@/contexts/CompareContext";
import Link from "next/link";
import Image from "next/image";

export function CompareFloatingBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl rounded-2xl border border-[#2A2A2E] bg-[#151518]/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-4">
        {/* Imóveis selecionados */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {compareList.map((property) => (
            <div
              key={property.id}
              className="group relative flex-shrink-0"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[#2A2A2E]">
                {property.imagem ? (
                  <Image
                    src={property.imagem}
                    alt={property.referencia}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#7A7A7A]">
                    {property.referencia.slice(0, 3)}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeFromCompare(property.id)}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Slots vazios */}
          {Array.from({ length: 5 - compareList.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#2A2A2E]"
            >
              <span className="text-xs text-[#7A7A7A]">+</span>
            </div>
          ))}
        </div>

        {/* Contador */}
        <div className="hidden sm:block text-center">
          <p className="text-2xl font-bold text-white">{compareList.length}</p>
          <p className="text-xs text-[#7A7A7A]">de 5</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="rounded-lg p-2 text-[#7A7A7A] transition hover:bg-[#2A2A2E] hover:text-white"
            title="Limpar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <Link
            href="/comparar"
            className="flex items-center gap-2 rounded-full bg-[#E10600] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C10500]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="hidden sm:inline">Comparar</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
