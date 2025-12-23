"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BackofficeLayout } from "../../../../backoffice/components/BackofficeLayout";
import { ToastProvider, useToast } from "../../../../backoffice/components/ToastProvider";
import { getPreAngariacao, type PreAngariacaoDetail } from "../../../../src/services/backofficeApi";

function PreAngariacaoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { push } = useToast();
  const [item, setItem] = useState<PreAngariacaoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const id = useMemo(() => Number(params?.id), [params]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPreAngariacao(id);
        setItem(data);
      } catch (error) {
        console.error("Erro ao carregar pré-angariação:", error);
        push("Erro ao carregar pré-angariação", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, push]);

  const mapsUrl = useMemo(() => {
    if (!item?.morada) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.morada)}`;
  }, [item?.morada]);

  return (
    <BackofficeLayout title={item?.referencia_interna || "Pré-Angariação"}>
      <button
        onClick={() => router.push("/backoffice/pre-angariacoes")}
        className="mb-4 text-sm text-[#9CA3AF] hover:text-white"
      >
        ← Voltar à lista
      </button>

      {loading ? (
        <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-sm text-[#C5C5C5]">
          A carregar...
        </div>
      ) : !item ? (
        <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6 text-sm text-red-300">
          Não foi possível carregar esta pré-angariação.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
              <p className="text-xs uppercase text-[#888]">Agente</p>
              <p className="text-lg font-semibold text-white">{item.agent_name || `Agente #${item.agent_id}`}</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Criado em {new Date(item.created_at).toLocaleString("pt-PT")}</p>
            </div>
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
              <p className="text-xs uppercase text-[#888]">Status</p>
              <p className="text-lg font-semibold uppercase text-[#E10600]">{item.status}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-[#1F1F22]">
                <div className="h-2 rounded-full bg-[#E10600]" style={{ width: `${item.progresso}%` }} />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">{item.progresso}% completo</p>
            </div>
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
              <p className="text-xs uppercase text-[#888]">Proprietário</p>
              <p className="text-lg font-semibold text-white">{item.proprietario_nome}</p>
              {item.proprietario_telefone && (
                <p className="text-xs text-[#9CA3AF] mt-1">Tel: {item.proprietario_telefone}</p>
              )}
              {item.proprietario_email && (
                <p className="text-xs text-[#9CA3AF]">Email: {item.proprietario_email}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-[#888]">Morada</p>
                <p className="text-base font-semibold text-white">{item.morada || "—"}</p>
                {item.freguesia && <p className="text-xs text-[#9CA3AF]">{item.freguesia} · {item.concelho}</p>}
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-[#2A2A2E] px-3 py-2 text-sm text-white hover:bg-[#151518]"
                >
                  Ver no mapa
                </a>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Documentos</p>
              </div>
              {item.documentos?.length ? (
                <div className="space-y-2">
                  {item.documentos.map((doc, idx) => (
                    <a
                      key={`${doc.url}-${idx}`}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded border border-[#2A2A2E] px-3 py-2 text-sm text-white hover:bg-[#151518]"
                    >
                      <span>
                        <span className="text-xs uppercase text-[#888]">{doc.type}</span>
                        <span className="ml-2">{doc.name}</span>
                      </span>
                      <span className="text-xs text-[#9CA3AF]">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString("pt-PT") : ""}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF]">Nenhum documento enviado.</p>
              )}
            </div>

            <div className="rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Fotos</p>
              </div>
              {item.fotos?.length ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {item.fotos.map((foto, idx) => (
                    <div key={`${foto.url}-${idx}`} className="overflow-hidden rounded-lg border border-[#1F1F22] bg-[#111]">
                      <img src={foto.url} alt={foto.caption || `Foto ${idx + 1}`} className="h-28 w-full object-cover" />
                      {foto.caption && <p className="px-2 py-1 text-xs text-[#C5C5C5]">{foto.caption}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF]">Sem fotos anexadas.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <PreAngariacaoDetailPage />
    </ToastProvider>
  );
}
