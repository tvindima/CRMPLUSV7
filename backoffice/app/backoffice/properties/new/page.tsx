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

  async function parseApiError(res: Response, fallback: string) {
    try {
      const data = await res.json();
      return data?.error || data?.detail || fallback;
    } catch {
      const text = await res.text();
      return text || fallback;
    }
  }

  async function linkOwnerToProperty(data: PropertyFormSubmit, propertyId: number) {
    const selection = data.ownerSelection;
    if (!selection || selection.mode === "none") return;

    if (selection.mode === "existing" && selection.existingClientId) {
      const res = await fetch(`/api/clients/${selection.existingClientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          property_id: propertyId,
          client_type: "vendedor",
        }),
      });

      if (!res.ok) {
        const reason = await parseApiError(res, "Erro ao associar cliente proprietário");
        throw new Error(reason);
      }
      return;
    }

    if (selection.mode === "new" && selection.newClient) {
      const agentId =
        typeof data.payload.agent_id === "number" && Number.isFinite(data.payload.agent_id)
          ? data.payload.agent_id
          : typeof data.selectedAgentId === "number" && Number.isFinite(data.selectedAgentId)
            ? data.selectedAgentId
            : null;

      if (!agentId) {
        throw new Error("Não foi possível criar proprietário: agente responsável em falta");
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agent_id: agentId,
          nome: selection.newClient.nome,
          email: selection.newClient.email || null,
          telefone: selection.newClient.telefone || null,
          nif: selection.newClient.nif || null,
          client_type: "vendedor",
          origin: "manual",
          property_id: propertyId,
        }),
      });

      if (!res.ok) {
        const reason = await parseApiError(res, "Erro ao criar cliente proprietário");
        throw new Error(reason);
      }
    }
  }

  // Handler para PropertyForm (imobiliário)
  async function handleRealEstateSubmit(data: PropertyFormSubmit) {
    try {
      setLoading(true);
      setError("");
      
      const property = await createBackofficeProperty(data.payload, data.files);

      try {
        await linkOwnerToProperty(data, property.id);
      } catch (ownerErr: any) {
        console.error("Imóvel criado, mas falhou associação de proprietário:", ownerErr);
        setError(
          `Imóvel criado com sucesso, mas falhou a associação do proprietário: ${ownerErr?.message || "erro desconhecido"}`
        );
        router.push(`/backoffice/properties/${property.id}`);
        return;
      }

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
