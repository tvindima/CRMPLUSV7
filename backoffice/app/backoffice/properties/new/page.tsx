'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PropertyForm, PropertyFormSubmit } from "@/backoffice/components/PropertyForm";
import { ItemForm } from "@/components/ItemForm";
import { createBackofficeProperty } from "@/src/services/backofficeApi";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";
import { Loader2 } from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  const { sector, isRealEstate, loading: tenantLoading } = useTenant();
  const { term } = useTerminology();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handler para PropertyForm (imobiliário)
  async function handleRealEstateSubmit(data: PropertyFormSubmit) {
    try {
      setLoading(true);
      setError("");
      
      const property = await createBackofficeProperty(data.payload, data.files);
      
      // Redirect to property detail page
      router.push(`/backoffice/properties/${property.id}`);
    } catch (err: any) {
      console.error(`Erro ao criar ${term('item_singular', 'item')}:`, err);
      setError(err.message || `Erro ao criar ${term('item_singular', 'item')}. Tente novamente.`);
      setLoading(false);
    }
  }

  // Loading state
  if (tenantLoading) {
    return (
      <BackofficeLayout title={term('new_item', 'Novo Item')}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </BackofficeLayout>
    );
  }

  // Título e descrição baseados no sector
  const title = term('new_item', 'Novo Item');
  const description = `Preencha os dados ${sector === 'real_estate' ? 'do imóvel para angariação' : `do ${term('item_singular', 'item')}`}`;

  return (
    <BackofficeLayout title={title}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-[#999]">{description}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Usar PropertyForm para imobiliário, ItemForm para outros sectores */}
        {isRealEstate ? (
          <PropertyForm onSubmit={handleRealEstateSubmit} loading={loading} />
        ) : (
          <ItemForm mode="create" />
        )}
      </div>
    </BackofficeLayout>
  );
}
