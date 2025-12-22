'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";
import { PropertyForm, PropertyFormSubmit } from "@/backoffice/components/PropertyForm";
import { createBackofficeProperty } from "@/src/services/backofficeApi";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: PropertyFormSubmit) {
    try {
      setLoading(true);
      setError("");
      
      const property = await createBackofficeProperty(data.payload, data.files);
      
      // Redirect to property detail page
      router.push(`/backoffice/properties/${property.id}`);
    } catch (err: any) {
      console.error("Erro ao criar imóvel:", err);
      setError(err.message || "Erro ao criar imóvel. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Novo Imóvel">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Adicionar Novo Imóvel</h1>
          <p className="text-sm text-[#999]">Preencha os dados do imóvel para angariação</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <PropertyForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </BackofficeLayout>
  );
}
