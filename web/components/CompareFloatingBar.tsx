"use client";

import { useState } from "react";
import { useCompare } from "@/contexts/CompareContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { AddExternalPropertyModal } from "./AddExternalPropertyModal";

export function CompareFloatingBar() {
  const { compareList, removeFromCompare, clearCompare, canAddMore } = useCompare();
  const { isAuthenticated } = useAuth();
  const [showExternalModal, setShowExternalModal] = useState(false);

  // Só mostrar a barra se o utilizador estiver autenticado e tiver imóveis
  if (!isAuthenticated || compareList.length === 0) return null;

  // Verificar se é imóvel externo (imagem começa com "external:")
  const isExternal = (imagem?: string) => imagem?.startsWith("external:");
  const getExternalUrl = (imagem?: string) => imagem?.replace("external:", "") || "";

  return (
    <>
      <div
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full px-6 py-3 shadow-2xl backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(10, 10, 12, 0.95)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
          minWidth: 'min(90vw, 600px)',
          maxWidth: 'min(90vw, 900px)',
        }}
      >
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
            {compareList.map((property) => (
              <div
                key={property.id}
                className="group relative flex-shrink-0"
              >
                <div 
                  className={`relative h-12 w-12 overflow-hidden rounded-lg ${isExternal(property.imagem) ? "ring-2 ring-blue-500" : ""}`}
                  style={{ backgroundColor: 'var(--color-border)' }}
                >
                  {property.imagem && !isExternal(property.imagem) ? (
                    <Image
                      src={property.imagem}
                      alt={property.referencia}
                      fill
                      className="object-cover"
                    />
                  ) : isExternal(property.imagem) ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  ) : (
                    <div 
                      className="flex h-full w-full items-center justify-center text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {property.referencia.slice(0, 3)}
                    </div>
                  )}
                </div>
                {/* Tooltip para externos */}
                {isExternal(property.imagem) && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-blue-500 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    Externo
                  </div>
                )}
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

            {/* Slots vazios com botão de adicionar externo no primeiro */}
            {Array.from({ length: 5 - compareList.length }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={() => i === 0 && canAddMore && setShowExternalModal(true)}
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed transition ${
                  i === 0 && canAddMore
                    ? "border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/10 cursor-pointer"
                    : "cursor-default"
                }`}
                style={i === 0 && canAddMore ? undefined : { borderColor: 'var(--color-border)' }}
                title={i === 0 ? "Adicionar imóvel externo" : undefined}
              >
                {i === 0 ? (
                  <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>+</span>
                )}
              </button>
            ))}
        </div>

        {/* Contador */}
        <div className="hidden sm:block text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{compareList.length}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>de 5</p>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="rounded-lg p-2 transition"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
            title="Limpar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <Link
            href="/comparar"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span className="hidden sm:inline">Comparar</span>
          </Link>
        </div>
      </div>

      {/* Modal para adicionar imóvel externo */}
      <AddExternalPropertyModal
        isOpen={showExternalModal}
        onClose={() => setShowExternalModal(false)}
      />
    </>
  );
}
