'use client';

import { useEffect, useMemo, useRef, useState } from "react";

// ✅ LIMITE MÁXIMO DE FOTOS POR PROPRIEDADE
const MAX_PHOTOS = 30;

type Props = {
  existingUrls: string[];
  files: File[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (idx: number) => void;
  onRemoveExisting: (idx: number) => void;
};

export function UploadArea({ existingUrls, files, onAddFiles, onRemoveFile, onRemoveExisting }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : "",
      })),
    [files]
  );

  // Total de fotos (existentes + novas)
  const totalPhotos = existingUrls.length + files.length;
  const remainingSlots = MAX_PHOTOS - totalPhotos;
  const isAtLimit = totalPhotos >= MAX_PHOTOS;

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  // Handler com validação de limite
  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const filesArray = Array.from(fileList);
    const availableSlots = MAX_PHOTOS - (existingUrls.length + files.length);
    
    if (filesArray.length > availableSlots) {
      if (availableSlots <= 0) {
        setLimitError(`❌ Limite atingido! Máximo de ${MAX_PHOTOS} fotos por imóvel.`);
      } else {
        setLimitError(`⚠️ Só pode adicionar mais ${availableSlots} foto(s). Serão usadas apenas as primeiras ${availableSlots}.`);
        // Criar novo FileList com apenas os ficheiros permitidos
        const dt = new DataTransfer();
        filesArray.slice(0, availableSlots).forEach(f => dt.items.add(f));
        onAddFiles(dt.files);
      }
      setTimeout(() => setLimitError(null), 5000);
      return;
    }
    
    setLimitError(null);
    onAddFiles(fileList);
  };

  return (
    <div className="rounded border border-dashed border-[#2A2A2E] bg-[#151518] p-3">
      {/* Header com contador */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[#C5C5C5]">
          📸 Adicione fotos profissionais do imóvel
        </p>
        <span className={`text-xs font-mono px-2 py-1 rounded ${
          isAtLimit ? 'bg-red-500/20 text-red-400' : 
          totalPhotos > MAX_PHOTOS * 0.8 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-[#2A2A2E] text-[#888]'
        }`}>
          {totalPhotos}/{MAX_PHOTOS}
        </span>
      </div>
      
      {/* Mensagem de erro de limite */}
      {limitError && (
        <div className="mb-3 p-2 rounded border border-red-500/30 bg-red-500/10 text-xs text-red-400">
          {limitError}
        </div>
      )}
      
      {/* Área de upload */}
      <div
        className={`mt-2 flex cursor-pointer items-center justify-center rounded border-2 border-dashed px-3 py-8 text-sm font-semibold transition-all ${
          isAtLimit 
            ? 'border-[#444] bg-[#1A1A1A] text-[#666] cursor-not-allowed' 
            : 'border-[#E10600]/40 bg-[#E10600]/5 text-[#E10600] hover:border-[#E10600] hover:bg-[#E10600]/10'
        }`}
        onClick={() => !isAtLimit && inputRef.current?.click()}
      >
        <span className="flex items-center gap-2">
          {isAtLimit ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Limite de {MAX_PHOTOS} fotos atingido
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Clique para selecionar imagens ({remainingSlots} disponíveis)
            </>
          )}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isAtLimit}
          onChange={(e) => handleAddFiles(e.target.files)}
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
