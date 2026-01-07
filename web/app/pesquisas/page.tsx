"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SavedSearch {
  id: string;
  name: string;
  filters: {
    tipo?: string;
    negocio?: string;
    localizacao?: string;
    precoMin?: number;
    precoMax?: number;
    tipologia?: string;
  };
  createdAt: string;
  resultsCount?: number;
}

export default function PesquisasPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("savedSearches");
    if (stored) {
      setSearches(JSON.parse(stored));
    }
  }, []);

  const deleteSearch = (id: string) => {
    const updated = searches.filter(s => s.id !== id);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
    setSearches(updated);
  };

  const buildSearchUrl = (filters: SavedSearch["filters"]) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.set("tipo", filters.tipo);
    if (filters.negocio) params.set("negocio", filters.negocio);
    if (filters.localizacao) params.set("localizacao", filters.localizacao);
    if (filters.precoMin) params.set("precoMin", filters.precoMin.toString());
    if (filters.precoMax) params.set("precoMax", filters.precoMax.toString());
    if (filters.tipologia) params.set("tipologia", filters.tipologia);
    return `/imoveis?${params.toString()}`;
  };

  const formatFilters = (filters: SavedSearch["filters"]) => {
    const parts: string[] = [];
    if (filters.tipo) parts.push(filters.tipo);
    if (filters.negocio) parts.push(filters.negocio);
    if (filters.localizacao) parts.push(filters.localizacao);
    if (filters.tipologia) parts.push(filters.tipologia);
    if (filters.precoMin || filters.precoMax) {
      const min = filters.precoMin ? `${filters.precoMin.toLocaleString("pt-PT")}€` : "0€";
      const max = filters.precoMax ? `${filters.precoMax.toLocaleString("pt-PT")}€` : "∞";
      parts.push(`${min} - ${max}`);
    }
    return parts.length > 0 ? parts.join(" • ") : "Todos os imóveis";
  };

  if (!isClient) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pesquisas Guardadas</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Guarde as suas pesquisas para aceder rapidamente aos imóveis que lhe interessam.
        </p>
      </div>

      {searches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed py-16" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-background-secondary) 50%, transparent)' }}>
          <div className="rounded-full p-6" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
            <svg className="h-12 w-12" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Sem pesquisas guardadas</h2>
            <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Faça uma pesquisa e guarde-a para aceder mais tarde.
            </p>
          </div>
          <Link
            href="/imoveis"
            className="rounded-full px-6 py-3 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Pesquisar imóveis
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((search) => (
            <div
              key={search.id}
              className="flex flex-col gap-4 rounded-xl border p-4 transition md:flex-row md:items-center md:justify-between"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}
            >
              <div className="space-y-1">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{search.name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{formatFilters(search.filters)}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Guardada em {new Date(search.createdAt).toLocaleDateString("pt-PT")}
                  {search.resultsCount !== undefined && ` • ${search.resultsCount} resultados`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={buildSearchUrl(search.filters)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Ver resultados
                </Link>
                <button
                  onClick={() => deleteSearch(search.id)}
                  className="rounded-lg border px-4 py-2 text-sm transition hover:border-red-500 hover:text-red-400"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
