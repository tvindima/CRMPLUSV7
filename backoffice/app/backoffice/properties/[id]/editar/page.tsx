'use client';

import { useEffect, useState } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PropertyForm, PropertyFormSubmit } from "@/backoffice/components/PropertyForm";
import { ToastProvider, useToast } from "../../../../../backoffice/components/ToastProvider";
import { BackofficeProperty, getBackofficeProperty, updateBackofficeProperty } from "@/src/services/backofficeApi";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";

type Props = { params: { id: string } };

export default function EditarItemPage({ params }: Props) {
  return (
    <ToastProvider>
      <EditarItemInner id={Number(params.id)} />
    </ToastProvider>
  );
}

function EditarItemInner({ id }: { id: number }) {
  const toast = useToast();
  const { term } = useTerminology();
  const [property, setProperty] = useState<BackofficeProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getBackofficeProperty(id);
        setProperty(data);
      } catch (err: any) {
        toast.push(err?.message || `Erro ao carregar ${term('item_singular', 'item')}`, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, toast]);

  const handleSubmit = async ({ payload, files, imagesToKeep }: PropertyFormSubmit) => {
    setSaving(true);
    try {
      const updated = await updateBackofficeProperty(id, payload, files, imagesToKeep);
      setProperty(updated);
      setLastSavedAt(new Date());
      toast.push(`${term('item', 'Item')} atualizado`, "success");
    } catch (err: any) {
      toast.push(err?.message || "Erro ao atualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BackofficeLayout title={`Editar ${term('item_singular', 'item')}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">Atualizar {term('item_singular', 'item')}</p>
          <p className="text-sm text-[#C5C5C5]">Preenche os campos conforme o render (9/10). TODO: validar campos extra.</p>
        </div>
        <div className="flex gap-2 text-sm text-[#C5C5C5]">
          <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Ver contactos</button>
          <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Reatribuir</button>
        </div>
      </div>

      {loading && <p className="text-sm text-[#C5C5C5]">A carregar {term('item_singular', 'item')}...</p>}
      {!loading && !property && <p className="text-sm text-red-400">{term('item', 'Item')} não encontrado.</p>}
      {property && (
        <>
          {lastSavedAt && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              {term('item_singular', 'Item')} guardado e imagens atualizadas às {lastSavedAt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <PropertyForm initial={property} onSubmit={handleSubmit} loading={saving} />
        </>
      )}
    </BackofficeLayout>
  );
}
