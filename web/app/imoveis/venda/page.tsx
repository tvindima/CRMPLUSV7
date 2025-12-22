'use client';

import { useEffect, useMemo, useState } from "react";
import { getProperties, Property } from "../../../src/services/publicApi";
import { PropertyCard } from "../../../components/PropertyCard";
import { SectionHeader } from "../../../components/SectionHeader";

export default function VendaPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProperties(500).then(setProperties).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const business = (p.business_type || "").toLowerCase();
        if (business.includes("vend")) return true;
        const text = `${p.title ?? ""} ${p.description ?? ""}`.toLowerCase();
        return text.includes("venda");
      }),
    [properties]
  );

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Imóveis" title="Imóveis para Venda" subtitle="Filtrados por negócio: venda." />
      {loading && <p className="text-[#C5C5C5]">A carregar…</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
