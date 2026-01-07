"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PropertyAlert {
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
  frequency: "instant" | "daily" | "weekly";
  enabled: boolean;
  createdAt: string;
  lastNotified?: string;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<PropertyAlert[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("propertyAlerts");
    if (stored) {
      setAlerts(JSON.parse(stored));
    }
  }, []);

  const saveAlerts = (updated: PropertyAlert[]) => {
    localStorage.setItem("propertyAlerts", JSON.stringify(updated));
    setAlerts(updated);
  };

  const toggleAlert = (id: string) => {
    const updated = alerts.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    saveAlerts(updated);
  };

  const deleteAlert = (id: string) => {
    if (confirm("Tem a certeza que deseja eliminar este alerta?")) {
      const updated = alerts.filter(a => a.id !== id);
      saveAlerts(updated);
    }
  };

  const formatFilters = (filters: PropertyAlert["filters"]) => {
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

  const frequencyLabels = {
    instant: "Imediato",
    daily: "Diário",
    weekly: "Semanal"
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alertas de Imóveis</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Receba notificações quando novos imóveis corresponderem às suas preferências.
          </p>
        </div>
        <Link
          href="/imoveis"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Criar alerta
        </Link>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 mt-0.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-blue-400">Como funcionam os alertas?</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Ao pesquisar imóveis, pode guardar os filtros como alerta. Quando novos imóveis corresponderem 
              aos seus critérios, será notificado por email de acordo com a frequência escolhida.
            </p>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed py-16" style={{ borderColor: 'var(--color-border)', backgroundColor: 'color-mix(in srgb, var(--color-background-secondary) 50%, transparent)' }}>
          <div className="rounded-full p-6" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}>
            <svg className="h-12 w-12" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Sem alertas configurados</h2>
            <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Crie o seu primeiro alerta para não perder nenhuma oportunidade!
            </p>
          </div>
          <Link
            href="/imoveis"
            className="rounded-full px-6 py-3 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Pesquisar e criar alerta
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 transition ${!alert.enabled && 'opacity-60'}`}
              style={{ 
                backgroundColor: 'var(--color-background-secondary)',
                borderColor: alert.enabled ? 'color-mix(in srgb, var(--color-primary) 30%, transparent)' : 'var(--color-border)'
              }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className="mt-1 relative h-6 w-11 rounded-full transition"
                    style={{ backgroundColor: alert.enabled ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        alert.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{alert.name}</h3>
                      <span 
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{ 
                          backgroundColor: alert.enabled ? 'rgba(34, 197, 94, 0.2)' : 'var(--color-border)',
                          color: alert.enabled ? 'rgb(74, 222, 128)' : 'var(--color-text-muted)'
                        }}
                      >
                        {alert.enabled ? "Ativo" : "Pausado"}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{formatFilters(alert.filters)}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {frequencyLabels[alert.frequency]}
                      </span>
                      <span>Criado em {new Date(alert.createdAt).toLocaleDateString("pt-PT")}</span>
                      {alert.lastNotified && (
                        <span>Última notificação: {new Date(alert.lastNotified).toLocaleDateString("pt-PT")}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="rounded-lg border p-2 transition hover:border-red-500 hover:text-red-400"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    title="Eliminar alerta"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
