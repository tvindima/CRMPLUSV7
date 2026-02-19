'use client';

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  existingUrls: string[];
  files: File[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (idx: number) => void;
  onRemoveExisting: (idx: number) => void;
  onMoveFile: (from: number, to: number) => void;
  onMoveExisting: (from: number, to: number) => void;
};

function normalizeImageUrl(raw: string): string {
  const value = (raw || "").trim();
  if (!value) return value;
  if (!value.includes("/_next/image?url=")) return value;
  try {
    const parsed = new URL(value, "http://localhost");
    const nested = parsed.searchParams.get("url");
    return nested ? decodeURIComponent(nested) : value;
  } catch {
    return value;
  }
}

export function UploadArea({
  existingUrls,
  files,
  onAddFiles,
  onRemoveFile,
  onRemoveExisting,
  onMoveFile,
  onMoveExisting,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [failedExisting, setFailedExisting] = useState<Record<number, boolean>>({});
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : "",
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <div className="rounded border border-dashed border-[#2A2A2E] bg-[#151518] p-3">
      <p className="text-sm text-[#C5C5C5]">Upload real via backend. Arrasta imagens ou clica para selecionar.</p>
      <div
        className="mt-2 flex cursor-pointer items-center justify-center rounded border border-[#2A2A2E] px-3 py-6 text-sm text-[#E10600]"
        onClick={() => inputRef.current?.click()}
      >
        Selecionar ficheiros
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onAddFiles(e.target.files)}
        />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {existingUrls.map((url, idx) => (
          <div key={`existing-${idx}`} className="rounded border border-[#2A2A2E] bg-[#0B0B0D] p-2 text-xs text-white">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px]">{idx + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveExisting(idx, idx - 1)}
                  className="rounded border border-[#2A2A2E] px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                  title="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === existingUrls.length - 1}
                  onClick={() => onMoveExisting(idx, idx + 1)}
                  className="rounded border border-[#2A2A2E] px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                  title="Descer"
                >
                  ↓
                </button>
              </div>
            </div>
            <img
              src={normalizeImageUrl(url)}
              alt={`Imagem existente ${idx + 1}`}
              className="h-24 w-full rounded object-cover"
              onError={() => setFailedExisting((prev) => ({ ...prev, [idx]: true }))}
            />
            {failedExisting[idx] && (
              <p className="mt-1 text-[10px] text-yellow-400">Preview indisponível para esta URL</p>
            )}
            <p className="mt-1 truncate text-[10px] text-[#999]">{url}</p>
            <button type="button" onClick={() => onRemoveExisting(idx)} className="mt-1 text-[#E10600]">
              Remover (mantém se não guardar)
            </button>
          </div>
        ))}
        {previews.map((file, idx) => (
          <div key={`new-${idx}`} className="rounded border border-[#2A2A2E] bg-[#0B0B0D] p-2 text-xs text-white">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded bg-green-700/70 px-1.5 py-0.5 text-[10px]">Nova {idx + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveFile(idx, idx - 1)}
                  className="rounded border border-[#2A2A2E] px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                  title="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === previews.length - 1}
                  onClick={() => onMoveFile(idx, idx + 1)}
                  className="rounded border border-[#2A2A2E] px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                  title="Descer"
                >
                  ↓
                </button>
              </div>
            </div>
            <p className="truncate">{file.name}</p>
            <img src={file.url} alt={file.name} className="mt-2 h-24 w-full rounded object-cover" />
            <button type="button" onClick={() => onRemoveFile(idx)} className="text-[#E10600]">
              Remover
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#C5C5C5]">
        A ordem apresentada aqui é a ordem final de publicação no site/portais após guardar.
      </p>
    </div>
  );
}
