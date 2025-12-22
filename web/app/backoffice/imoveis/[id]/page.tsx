'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { BackofficeLayout } from "../../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { BackofficeProperty, getBackofficeProperty } from "../../../../src/services/backofficeApi";

type Props = { params: { id: string } };

export default function ImovelDetalhePage({ params }: Props) {
  return (
    <ToastProvider>
      <ImovelDetalheInner id={Number(params.id)} />
    </ToastProvider>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#1F1F22] bg-[#0F0F10] p-3 text-sm text-white">
      <span className="text-xs uppercase tracking-wide text-[#C5C5C5]">{label}</span>
      <span className="text-base">{value ?? "—"}</span>
    </div>
  );
}

function ImovelDetalheInner({ id }: { id: number }) {
  const toast = useToast();
  const [property, setProperty] = useState<BackofficeProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getBackofficeProperty(id);
        setProperty(data);
      } catch (err: any) {
        toast.push(err?.message || "Erro ao carregar imóvel", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, toast]);

  return (
    <BackofficeLayout title="Imóvel">
      {loading && <p className="text-sm text-[#C5C5C5]">A carregar...</p>}
      {!loading && !property && <p className="text-sm text-red-400">Imóvel não encontrado.</p>}

      {property && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{property.reference}</p>
                <p className="text-sm text-[#C5C5C5]">{property.title}</p>
                <p className="text-sm text-[#C5C5C5]">{property.location || [property.municipality, property.parish].filter(Boolean).join(" / ")}</p>
              </div>
              <div className="flex gap-2 text-sm text-[#C5C5C5]">
                <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Ver contactos</button>
                <button className="rounded-lg bg-[#101013] px-3 py-2 ring-1 ring-[#2A2A2E]">Reatribuir</button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4 md:grid-cols-2">
            <InfoRow label="Negócio" value={property.business_type} />
            <InfoRow label="Tipo" value={property.property_type} />
            <InfoRow label="Tipologia" value={property.typology} />
            <InfoRow label="Preço" value={property.price ? `${property.price.toLocaleString("pt-PT")} €` : "—"} />
            <InfoRow label="Área total" value={property.land_area ? `${property.land_area} m²` : "—"} />
            <InfoRow label="Área útil" value={property.usable_area ? `${property.usable_area} m²` : "—"} />
            <InfoRow label="Concelho/Freguesia" value={[property.municipality, property.parish].filter(Boolean).join(" / ")} />
            <InfoRow label="Estado" value={property.condition} />
            <InfoRow label="Cert. energético" value={property.energy_certificate} />
            <InfoRow label="Observações" value={property.observations} />
            <InfoRow label="CRM" value="CRM PLUS" />
            <InfoRow label="Home Page" value="—" />
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
            <h3 className="text-lg font-semibold">Descrição</h3>
            <p className="mt-2 text-sm text-[#C5C5C5]">{property.description || "—"}</p>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
            <h3 className="text-lg font-semibold">Galeria</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {(property.images || []).map((src, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl border border-[#1F1F22] bg-[#0B0B0D]">
                  <Image src={src} alt={`Imagem ${idx + 1}`} width={600} height={400} className="h-40 w-full object-cover" />
                </div>
              ))}
              {(!property.images || property.images.length === 0) && (
                <div className="rounded-xl border border-dashed border-[#2A2A2E] bg-[#0B0B0D] p-6 text-center text-sm text-[#C5C5C5]">
                  TODO: carregar imagens reais (API /properties/{id}/upload)
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
              <h3 className="text-lg font-semibold">Visitas</h3>
              <p className="text-sm text-[#C5C5C5]">TODO: listar visitas quando API estiver disponível.</p>
            </div>
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
              <h3 className="text-lg font-semibold">Contactos</h3>
              <p className="text-sm text-[#C5C5C5]">TODO: ligar a contactos reais.</p>
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}
