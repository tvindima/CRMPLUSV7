"use client";

import { useCompare } from "@/contexts/CompareContext";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MortgageSimulator } from "@/components/MortgageSimulator";
import { TaxCalculator } from "@/components/TaxCalculator";
import { AddExternalPropertyModal } from "@/components/AddExternalPropertyModal";
import { LoginPromptModal } from "@/components/LoginPromptModal";
import { createPortal } from "react-dom";

// Helper para verificar se é imóvel externo
const isExternal = (imagem?: string) => imagem?.startsWith("external:");
const getExternalUrl = (imagem?: string) => imagem?.replace("external:", "") || "";

export default function CompararPage() {
  const { compareList, removeFromCompare, clearCompare, canAddMore } = useCompare();
  const { isAuthenticated } = useAuth();
  const [showSimulator, setShowSimulator] = useState<number | null>(null);
  const [showTaxCalc, setShowTaxCalc] = useState<number | null>(null);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingTool, setPendingTool] = useState<string>("");
  const [pendingPrice, setPendingPrice] = useState<number>(0);

  const handleToolClick = (tool: "simulator" | "tax", price: number) => {
    if (!isAuthenticated) {
      setPendingTool(tool === "simulator" ? "Simulador de Prestação" : "Calculadora de IMT");
      setPendingPrice(price);
      setShowLoginPrompt(true);
      return;
    }
    
    if (tool === "simulator") {
      setShowSimulator(price);
    } else {
      setShowTaxCalc(price);
    }
  };

  if (compareList.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
          <svg className="h-12 w-12" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Nenhum imóvel para comparar</h1>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>Adicione até 5 imóveis para comparar as suas características.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/imoveis"
            className="rounded-full px-6 py-3 font-semibold text-white transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Explorar Imóveis
          </Link>
          <button
            onClick={() => setShowExternalModal(true)}
            className="flex items-center justify-center gap-2 rounded-full border border-blue-500 px-6 py-3 font-semibold text-blue-400 transition hover:bg-blue-500 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Adicionar Imóvel Externo
          </button>
        </div>
        
        {/* Modal para adicionar externo mesmo sem imóveis */}
        <AddExternalPropertyModal
          isOpen={showExternalModal}
          onClose={() => setShowExternalModal(false)}
        />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  };

  const CompareRow = ({ label, values }: { label: string; values: (string | number | boolean | undefined)[] }) => (
    <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <td className="py-3 pr-4 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{label}</td>
      {values.map((value, idx) => (
        <td key={idx} className="py-3 px-4 text-sm text-center" style={{ color: 'var(--color-text)' }}>
          {typeof value === "boolean" ? (
            value ? (
              <svg className="mx-auto h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="mx-auto h-5 w-5" style={{ color: 'var(--color-text-muted)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )
          ) : value !== undefined && value !== null ? (
            value
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>—</span>
          )}
        </td>
      ))}
    </tr>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-text)' }}>Comparar Imóveis</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{compareList.length} de 5 imóveis selecionados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAddMore && (
            <button
              onClick={() => setShowExternalModal(true)}
              className="flex items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-500 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Adicionar Externo
            </button>
          )}
          <button
            onClick={clearCompare}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition hover:border-red-500 hover:text-red-500"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpar tudo
          </button>
        </div>
      </div>

      {/* Tabela de Comparação */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
              <th className="p-4 text-left text-sm font-medium w-40" style={{ color: 'var(--color-text-muted)' }}></th>
              {compareList.map((property) => {
                const external = isExternal(property.imagem);
                const externalUrl = getExternalUrl(property.imagem);
                
                return (
                <th key={property.id} className="p-4 text-center min-w-[200px]">
                  <div className="relative">
                    {/* Botão remover */}
                    <button
                      onClick={() => removeFromCompare(property.id)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition z-10"
                      style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    {/* Badge Externo */}
                    {external && (
                      <div className="absolute left-0 top-0 z-10 rounded-br-lg bg-blue-500 px-2 py-1 text-[10px] font-bold text-white">
                        EXTERNO
                      </div>
                    )}
                    
                    {/* Imagem */}
                    <div className={`relative mb-3 h-32 w-full overflow-hidden rounded-lg ${external ? "ring-2 ring-blue-500" : ""}`} style={{ backgroundColor: 'var(--color-border)' }}>
                      {property.imagem && !external ? (
                        <Image
                          src={property.imagem}
                          alt={property.referencia}
                          fill
                          className="object-cover"
                        />
                      ) : external ? (
                        <div className="flex h-full flex-col items-center justify-center gap-2">
                          <svg className="h-10 w-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-xs text-blue-400">Imóvel Externo</span>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-10 w-10" style={{ color: 'var(--color-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Referência / Link */}
                    {external ? (
                      <a 
                        href={externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <span className="text-xs text-blue-400">{property.referencia}</span>
                        <p className="text-sm font-semibold text-white hover:text-blue-400 transition line-clamp-2 flex items-center justify-center gap-1">
                          {property.titulo || "Imóvel Externo"}
                          <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </p>
                      </a>
                    ) : (
                      <Link href={`/imovel/${property.referencia}`} className="block">
                        <span className="text-xs" style={{ color: 'var(--color-primary)' }}>{property.referencia}</span>
                        <p className="text-sm font-semibold transition line-clamp-2" style={{ color: 'var(--color-text)' }}>
                          {property.titulo || property.referencia}
                        </p>
                      </Link>
                    )}
                  </div>
                </th>
              )})}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Preço" values={compareList.map((p) => formatPrice(p.preco))} />
            <CompareRow label="Tipologia" values={compareList.map((p) => p.tipologia)} />
            <CompareRow label="Área Útil" values={compareList.map((p) => p.area_util ? `${p.area_util} m²` : undefined)} />
            <CompareRow label="Área Bruta" values={compareList.map((p) => p.area_bruta ? `${p.area_bruta} m²` : undefined)} />
            <CompareRow label="Quartos" values={compareList.map((p) => p.quartos)} />
            <CompareRow label="Casas de Banho" values={compareList.map((p) => p.casas_banho)} />
            <CompareRow label="Localização" values={compareList.map((p) => p.localizacao)} />
            <CompareRow label="Tipo de Negócio" values={compareList.map((p) => p.tipo_negocio)} />
            <CompareRow label="Tipo de Imóvel" values={compareList.map((p) => p.tipo_imovel)} />
            <CompareRow label="Cert. Energético" values={compareList.map((p) => p.certificado_energetico)} />
            
            {/* Ações */}
            <tr>
              <td className="py-4 pr-4 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Ferramentas</td>
              {compareList.map((property) => {
                const external = isExternal(property.imagem);
                const externalUrl = getExternalUrl(property.imagem);
                
                return (
                <td key={property.id} className="py-4 px-4">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToolClick("simulator", property.preco)}
                      className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-white transition"
                      style={{ backgroundColor: 'var(--color-border)' }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Simular Prestação
                      {!isAuthenticated && (
                        <svg className="h-3 w-3" style={{ color: 'var(--color-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => handleToolClick("tax", property.preco)}
                      className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-white transition"
                      style={{ backgroundColor: 'var(--color-border)' }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Calcular IMT
                      {!isAuthenticated && (
                        <svg className="h-3 w-3" style={{ color: 'var(--color-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    {external ? (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-lg border border-blue-500 px-3 py-2 text-xs text-blue-400 transition hover:bg-blue-500 hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver no Site Original
                      </a>
                    ) : (
                      <Link
                        href={`/imovel/${property.referencia}`}
                        className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs transition"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                      >
                        Ver Detalhes
                      </Link>
                    )}
                  </div>
                </td>
              )})}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Preço por m² */}
      <div className="mt-6 rounded-xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
        <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Preço por m²</h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareList.length}, 1fr)` }}>
          {compareList.map((property) => {
            const precoM2 = property.area_util ? property.preco / property.area_util : null;
            return (
              <div key={property.id} className="text-center">
                <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{property.referencia}</p>
                {precoM2 ? (
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {precoM2.toLocaleString("pt-PT", { maximumFractionDigits: 0 })} €/m²
                  </p>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)' }}>N/D</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Simulador */}
      {showSimulator !== null && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowSimulator(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <MortgageSimulator valorImovel={showSimulator} onClose={() => setShowSimulator(null)} />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Calculadora IMT */}
      {showTaxCalc !== null && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={() => setShowTaxCalc(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <TaxCalculator valorImovel={showTaxCalc} onClose={() => setShowTaxCalc(null)} />
          </div>
        </div>,
        document.body
      )}

      {/* Modal para adicionar imóvel externo */}
      <AddExternalPropertyModal
        isOpen={showExternalModal}
        onClose={() => setShowExternalModal(false)}
      />

      {/* Modal Login Prompt */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        toolName={pendingTool}
      />
    </div>
  );
}
