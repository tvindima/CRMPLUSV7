'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { BackofficeProperty, getBackofficeProperty } from "../../../../src/services/backofficeApi";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";
import { useRouter } from "next/navigation";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

type Props = { params: { id: string } };

function normalizePropertyImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  // Some legacy records may store Next optimizer URLs.
  // We unwrap them to the original source URL to avoid recursive 400s.
  if (value.includes("/_next/image?url=")) {
    try {
      const parsed = new URL(value, "http://localhost");
      const nested = parsed.searchParams.get("url");
      if (nested) {
        const decoded = decodeURIComponent(nested).trim();
        if (decoded) return decoded;
      }
    } catch {
      return null;
    }
  }

  return value;
}

export default function ItemDetalhePage({ params }: Props) {
  return (
    <ToastProvider>
      <ItemDetalheInner id={Number(params.id)} />
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

function ItemDetalheInner({ id }: { id: number }) {
  const router = useRouter();
  const toast = useToast();
  const { sector, isRealEstate } = useTenant();
  const { term } = useTerminology();
  const [property, setProperty] = useState<BackofficeProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getBackofficeProperty(id);
        setProperty(data);
        setFailedImages({});
      } catch (err: any) {
        toast.push(err?.message || `Erro ao carregar ${term('item_singular', 'item')}`, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, toast]);

  const galleryImages = Array.isArray(property?.images)
    ? property.images
        .map(normalizePropertyImageUrl)
        .filter((src): src is string => Boolean(src))
    : [];

  return (
    <BackofficeLayout title={term('item', 'Item')}>
      {loading && <p className="text-sm text-[#C5C5C5]">A carregar...</p>}
      {!loading && !property && <p className="text-sm text-red-400">{term('item', 'Item')} não encontrado.</p>}

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
                <button 
                  onClick={() => router.push(`/backoffice/properties/${id}/editar`)}
                  className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-white transition-all hover:bg-[#c00500]"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Editar
                </button>
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
              {galleryImages.map((src, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl border border-[#1F1F22] bg-[#0B0B0D]">
                  {failedImages[idx] ? (
                    <div className="flex h-40 items-center justify-center text-sm text-[#C5C5C5]">
                      Imagem indisponível
                    </div>
                  ) : (
                    <Image
                      src={src}
                      alt={`Imagem ${idx + 1}`}
                      width={600}
                      height={400}
                      unoptimized
                      className="h-40 w-full object-cover"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [idx]: true }));
                      }}
                    />
                  )}
                </div>
              ))}
              {galleryImages.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#2A2A2E] bg-[#0B0B0D] p-6 text-center text-sm text-[#C5C5C5]">
                  TODO: carregar imagens reais (API /properties/{id}/upload)
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
              <h3 className="text-lg font-semibold">{term('visits', 'Agendamentos')}</h3>
              <p className="text-sm text-[#C5C5C5]">TODO: listar {term('visits', 'agendamentos').toLowerCase()} quando API estiver disponível.</p>
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
