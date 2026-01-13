'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const MAX_PHOTOS = 30;
const MAX_WIDTH = 1920;  // Largura máxima para visualização online
const MAX_HEIGHT = 1080; // Altura máxima
const QUALITY = 0.85;    // Qualidade JPEG/WebP (85%)
const MAX_FILE_SIZE_KB = 500; // Tamanho máximo por ficheiro após compressão

type Props = {
  existingUrls: string[];
  files: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (idx: number) => void;
  onRemoveExisting: (idx: number) => void;
};

/**
 * Comprime e redimensiona uma imagem no browser
 * Retorna um File optimizado para upload
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calcular novas dimensões mantendo aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para blob com compressão
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Criar novo File com o blob comprimido
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, '.webp'), 
            { type: 'image/webp' }
          );
          
          console.log(`[Compress] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${width}x${height})`);
          resolve(compressedFile);
        },
        'image/webp',
        QUALITY
      );
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

export function UploadArea({ existingUrls, files, onAddFiles, onRemoveFile, onRemoveExisting }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  
  const totalPhotos = existingUrls.length + files.length;
  const remainingSlots = MAX_PHOTOS - totalPhotos;
  
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        size: file.size,
        url: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : "",
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);
  
  const handleFileSelect = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    // Verificar limite
    const selectedCount = fileList.length;
    if (selectedCount > remainingSlots) {
      alert(`Só podes adicionar mais ${remainingSlots} foto(s). Limite máximo: ${MAX_PHOTOS} fotos.`);
      return;
    }
    
    setIsCompressing(true);
    setCompressionProgress(0);
    
    const compressedFiles: File[] = [];
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    
    for (let i = 0; i < imageFiles.length; i++) {
      try {
        const compressed = await compressImage(imageFiles[i]);
        compressedFiles.push(compressed);
        setCompressionProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      } catch (error) {
        console.error(`Erro ao comprimir ${imageFiles[i].name}:`, error);
        // Se falhar compressão, usa o ficheiro original
        compressedFiles.push(imageFiles[i]);
      }
    }
    
    setIsCompressing(false);
    onAddFiles(compressedFiles);
  }, [remainingSlots, onAddFiles]);

  return (
    <div className="rounded border border-dashed border-[#2A2A2E] bg-[#151518] p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#C5C5C5]">
          Fotos do imóvel
        </p>
        <span className={`text-sm font-medium ${totalPhotos >= MAX_PHOTOS ? 'text-red-500' : 'text-[#C5C5C5]'}`}>
          {totalPhotos}/{MAX_PHOTOS}
        </span>
      </div>
      
      {totalPhotos >= MAX_PHOTOS ? (
        <div className="mt-2 rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
          Limite máximo de {MAX_PHOTOS} fotos atingido. Remove algumas para adicionar novas.
        </div>
      ) : (
        <div
          className={`mt-2 flex cursor-pointer items-center justify-center rounded border border-[#2A2A2E] px-3 py-6 text-sm transition-colors ${
            isCompressing ? 'opacity-50 cursor-wait' : 'hover:border-[#E10600]/50 hover:bg-[#1A1A1F]'
          } text-[#E10600]`}
          onClick={() => !isCompressing && inputRef.current?.click()}
        >
          {isCompressing ? (
            <span>A comprimir imagens... {compressionProgress}%</span>
          ) : (
            <span>Selecionar ficheiros (máx. {remainingSlots} restantes)</span>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={isCompressing}
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {(existingUrls.length > 0 || previews.length > 0) && (
        <div className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {existingUrls.map((url, idx) => (
            <div key={`existing-${idx}`} className="group relative aspect-square overflow-hidden rounded border border-[#2A2A2E] bg-[#0B0B0D]">
              <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button 
                  onClick={() => onRemoveExisting(idx)} 
                  className="absolute right-1 top-1 rounded bg-red-500 p-1 text-xs text-white hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-xs text-white">
                {idx + 1}
              </span>
            </div>
          ))}
          {previews.map((file, idx) => (
            <div key={`new-${idx}`} className="group relative aspect-square overflow-hidden rounded border border-green-500/50 bg-[#0B0B0D]">
              <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button 
                  onClick={() => onRemoveFile(idx)} 
                  className="absolute right-1 top-1 rounded bg-red-500 p-1 text-xs text-white hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
              <span className="absolute bottom-1 left-1 rounded bg-green-500/80 px-1 text-xs text-white">
                Nova
              </span>
              <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                {(file.size / 1024).toFixed(0)}KB
              </span>
            </div>
          ))}
        </div>
      )}
      
      <p className="mt-2 text-xs text-[#666]">
        As imagens são automaticamente comprimidas para {MAX_WIDTH}x{MAX_HEIGHT}px max. em WebP ({QUALITY * 100}% qualidade).
      </p>
    </div>
  );
}
