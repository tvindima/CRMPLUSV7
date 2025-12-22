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
      <p className="text-sm text-[#C5C5C5]">
        📸 Adicione fotos profissionais do imóvel (fachada, salas, quartos, cozinha, etc.)
      </p>
      <div
        className="mt-2 flex cursor-pointer items-center justify-center rounded border-2 border-dashed border-[#E10600]/40 bg-[#E10600]/5 px-3 py-8 text-sm font-semibold text-[#E10600] hover:border-[#E10600] hover:bg-[#E10600]/10 transition-all"
        onClick={() => inputRef.current?.click()}
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Clique para selecionar imagens ou arraste aqui
        </span>
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
          <div key={`existing-${idx}`} className="group relative rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] overflow-hidden">
            <img src={url} alt={`Imagem ${idx + 1}`} className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                type="button"
                onClick={() => onRemoveExisting(idx)} 
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
              >
                🗑️ Remover
              </button>
            </div>
            <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
              Imagem {idx + 1}
            </p>
          </div>
        ))}
        {previews.map((file, idx) => (
          <div key={`new-${idx}`} className="group relative rounded-lg border border-green-500/50 bg-[#0B0B0D] overflow-hidden">
            <img src={file.url} alt={file.name} className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                type="button"
                onClick={() => onRemoveFile(idx)} 
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
              >
                🗑️ Remover
              </button>
            </div>
            <p className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs p-1 truncate font-semibold">
              ✨ Nova: {file.name}
            </p>
          </div>
        ))}
      </div>
      
      {(existingUrls.length > 0 || previews.length > 0) && (
        <p className="mt-2 text-xs text-green-400">
          ✓ {existingUrls.length + previews.length} imagem(ns) selecionada(s). Clique em "Guardar Imóvel" para fazer upload.
        </p>
      )}
      
      <p className="mt-2 text-xs text-[#888]">
        💡 Dica: A primeira imagem será usada como capa do imóvel nas galerias e listagens.
      </p>
    </div>
  );
}
