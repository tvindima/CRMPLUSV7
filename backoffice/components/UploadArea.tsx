'use client';

import { useEffect, useMemo, useRef } from "react";

type Props = {
  existingUrls: string[];
  files: File[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (idx: number) => void;
  onRemoveExisting: (idx: number) => void;
};

export function UploadArea({ existingUrls, files, onAddFiles, onRemoveFile, onRemoveExisting }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
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
            <p className="truncate">{url}</p>
            <button onClick={() => onRemoveExisting(idx)} className="text-[#E10600]">
              Remover (mantém se não guardar)
            </button>
          </div>
        ))}
        {previews.map((file, idx) => (
          <div key={`new-${idx}`} className="rounded border border-[#2A2A2E] bg-[#0B0B0D] p-2 text-xs text-white">
            <p className="truncate">{file.name}</p>
            <img src={file.url} alt={file.name} className="mt-2 h-24 w-full rounded object-cover" />
            <button onClick={() => onRemoveFile(idx)} className="text-[#E10600]">
              Remover
            </button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#C5C5C5]">
        Após gravar, as imagens são carregadas via endpoint /properties/&#123;id&#125;/upload. Reordenar ficará em TODO.
      </p>
    </div>
  );
}
