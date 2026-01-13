'use client';

import { useMemo, useState } from 'react';
import { SafeImage } from './SafeImage';
import { getPlaceholderImage } from '../src/utils/placeholders';

type Props = {
  images: string[];
  title: string;
};

export function PropertyGallery({ images, title }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const galleryImages = useMemo(() => {
    if (images && images.length > 0) return images;
    return [getPlaceholderImage(title)];
  }, [images, title]);

  return (
    <>
      {/* Main Image */}
      <div
        className="relative w-full cursor-pointer overflow-hidden rounded-2xl bg-black/80 min-h-[240px] sm:min-h-[320px] lg:min-h-[480px] max-h-[75vh]"
        onClick={() => setShowModal(true)}
      >
        <SafeImage
          src={galleryImages[selectedIndex]}
          alt={`${title} - Imagem ${selectedIndex + 1}`}
          fill
          className="object-contain object-center transition duration-300 hover:scale-[1.01]"
          priority
        />
        <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
          {selectedIndex + 1} / {galleryImages.length} — Clique para expandir
        </div>
      </div>

      {/* Thumbnails - Responsivos */}
      {galleryImages.length > 1 && (
        <div className="mt-3 sm:mt-4 flex gap-2 overflow-x-auto pb-2 snap-x">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative h-16 w-20 sm:h-20 sm:w-28 flex-shrink-0 overflow-hidden rounded-lg transition snap-center ${
                idx === selectedIndex ? 'ring-2' : 'opacity-60 hover:opacity-100'
              }`}
              style={idx === selectedIndex ? { '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties : undefined}
            >
              <SafeImage src={img} alt={`Miniatura ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setShowModal(false)}
        >
          <button
            onClick={() => setShowModal(false)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
            }}
            className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <SafeImage
              src={galleryImages[selectedIndex]}
              alt={`${title} - Imagem ${selectedIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
            }}
            className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-white">
            {selectedIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </>
  );
}
