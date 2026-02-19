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
type PropertyDocument = {
  id: number;
  property_id: number;
  file_name: string;
  file_url: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  created_at: string;
};

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
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

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

  useEffect(() => {
    const loadDocuments = async () => {
      setDocumentsLoading(true);
      try {
        const res = await fetch(`/api/properties/${id}/documents`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Falha ao carregar documentos");
        }

        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        toast.push(err?.message || "Erro ao carregar documentos", "error");
      } finally {
        setDocumentsLoading(false);
      }
    };

    loadDocuments();
  }, [id, toast]);

  const galleryImages = Array.isArray(property?.images)
    ? property.images
        .map(normalizePropertyImageUrl)
        .filter((src): src is string => Boolean(src))
    : [];

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const uploadDocuments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    setUploadingDocuments(true);
    try {
      const res = await fetch(`/api/properties/${id}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Falha no upload de documentos");
      }

      const created = await res.json();
      if (Array.isArray(created) && created.length > 0) {
        setDocuments((prev) => [...created, ...prev]);
      }
      toast.push("Documentos carregados com sucesso", "success");
    } catch (err: any) {
      toast.push(err?.message || "Erro ao carregar documentos", "error");
    } finally {
      setUploadingDocuments(false);
    }
  };

  const exportDocumentsCsv = () => {
    if (!documents.length) {
      toast.push("Sem documentos para exportar", "info");
      return;
    }

    const headers = ["id", "nome", "tipo", "tamanho_bytes", "url", "created_at"];
    const rows = documents.map((doc) => [
      doc.id,
      `"${(doc.file_name || "").replace(/"/g, '""')}"`,
      `"${(doc.mime_type || "").replace(/"/g, '""')}"`,
      doc.file_size_bytes || "",
      `"${(doc.file_url || "").replace(/"/g, '""')}"`,
      `"${doc.created_at}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-${id}-documents.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printDocuments = () => {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      toast.push("Permita popups para imprimir documentos", "info");
      return;
    }
    const rows = documents
      .map(
        (doc) => `
          <tr>
            <td>${doc.id}</td>
            <td>${doc.file_name}</td>
            <td>${doc.mime_type || "-"}</td>
            <td>${formatFileSize(doc.file_size_bytes)}</td>
            <td>${new Date(doc.created_at).toLocaleString("pt-PT")}</td>
          </tr>
        `
      )
      .join("");

    popup.document.write(`
      <html>
        <head>
          <title>Documentos do imóvel ${property?.reference || id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h2>Documentos do imóvel ${property?.reference || id}</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Nome</th><th>Tipo</th><th>Tamanho</th><th>Data</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

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

          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Documentos</h3>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg bg-[#E10600] px-3 py-2 text-sm font-medium text-white hover:bg-[#c00500]">
                  {uploadingDocuments ? "A enviar..." : "Adicionar documento"}
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => uploadDocuments(e.target.files)}
                    disabled={uploadingDocuments}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                  />
                </label>
                <button
                  onClick={exportDocumentsCsv}
                  className="rounded-lg bg-[#101013] px-3 py-2 text-sm ring-1 ring-[#2A2A2E] hover:bg-[#16161A]"
                >
                  Exportar
                </button>
                <button
                  onClick={printDocuments}
                  className="rounded-lg bg-[#101013] px-3 py-2 text-sm ring-1 ring-[#2A2A2E] hover:bg-[#16161A]"
                >
                  Imprimir
                </button>
              </div>
            </div>

            <div className="mt-3">
              {documentsLoading && <p className="text-sm text-[#C5C5C5]">A carregar documentos...</p>}
              {!documentsLoading && documents.length === 0 && (
                <p className="text-sm text-[#C5C5C5]">Sem documentos associados a este imóvel.</p>
              )}
              {!documentsLoading && documents.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="text-left text-[#C5C5C5]">
                        <th className="pb-2 pr-3">Nome</th>
                        <th className="pb-2 pr-3">Tipo</th>
                        <th className="pb-2 pr-3">Tamanho</th>
                        <th className="pb-2 pr-3">Data</th>
                        <th className="pb-2 pr-3">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-t border-[#1F1F22]">
                          <td className="py-2 pr-3">{doc.file_name}</td>
                          <td className="py-2 pr-3">{doc.mime_type || "—"}</td>
                          <td className="py-2 pr-3">{formatFileSize(doc.file_size_bytes)}</td>
                          <td className="py-2 pr-3">{new Date(doc.created_at).toLocaleString("pt-PT")}</td>
                          <td className="py-2 pr-3">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#7AA2FF] hover:underline"
                            >
                              Abrir
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
