'use client';

import { useEffect, useState } from "react";
import { BackofficeLayout } from "../../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { BackofficeProperty, getBackofficeProperties } from "../../../../src/services/backofficeApi";

export default function MapaImoveisPage() {
  return (
    <ToastProvider>
      <MapaImoveisInner />
    </ToastProvider>
  );
}

function MapaImoveisInner() {
  const toast = useToast();
  const [items, setItems] = useState<BackofficeProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getBackofficeProperties({ limit: 200 });
        setItems(data);
      } catch (err: any) {
        toast.push(err?.message || "Erro ao carregar imóveis", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  return (
    <BackofficeLayout title="Mapa de imóveis">
      <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
        <h2 className="text-lg font-semibold">Distribuição geográfica</h2>
        <p className="text-sm text-[#C5C5C5]">TODO: integrar mapa real com pins quando API fornecer coordenadas (lat/long).</p>
        {loading && <p className="mt-3 text-sm text-[#C5C5C5]">A carregar...</p>}
        {!loading && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#1F1F22] bg-[#0B0B0D] p-3 text-sm text-[#C5C5C5]">
                <p className="text-white">{p.reference}</p>
                <p>{[p.municipality, p.parish].filter(Boolean).join(" / ") || "—"}</p>
                <p>{p.price ? `${p.price.toLocaleString("pt-PT")} €` : "—"}</p>
                <p className="text-xs text-[#8A8A8F]">Sem coordenadas — aguarda API</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
}
