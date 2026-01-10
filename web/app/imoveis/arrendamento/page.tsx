'use client';

import { useEffect, useMemo, useState } from "react";
import { getProperties, Property } from "../../../src/services/publicApi";
import { PropertyCard } from "../../../components/PropertyCard";
import { SectionHeader } from "../../../components/SectionHeader";
import { useTerminology } from "@/contexts/TerminologyContext";

export default function ArrendamentoPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const { terms } = useTerminology();

  // Atualizar título da página
  useEffect(() => {
    document.title = `${terms.itemsCapitalized} para Arrendamento`;
  }, [terms]);

  useEffect(() => {
    getProperties(500).then(setProperties).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const business = (p.business_type || "").toLowerCase();
        if (business.includes("arrend")) return true;
        const text = `${p.title ?? ""} ${p.description ?? ""}`.toLowerCase();
        return text.includes("arrendamento");
      }),
    [properties]
  );

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={terms.itemsCapitalized} title={`${terms.itemsCapitalized} para Arrendamento`} subtitle="Filtrados por negócio: arrendamento." />
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>A carregar…</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
