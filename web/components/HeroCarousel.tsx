"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SafeImage } from "./SafeImage";
import type { Property } from "../src/services/publicApi";
import { getPropertyCover, getPlaceholderImage } from "../src/utils/placeholders";

interface HeroCarouselProps {
  properties: Property[];
}

export function HeroCarousel({ properties }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoError, setVideoError] = useState<boolean>(false);

  const currentProperty = properties[currentIndex] || properties[0];
  const heroImage = currentProperty ? getPropertyCover(currentProperty) : getPlaceholderImage("hero");
  const hasAnyVideo = properties.some((p) => !!p.video_url);
  
  // ✅ Detectar tipo de vídeo (YouTube, Vimeo, ou MP4 direto)
  const getVideoType = (url?: string | null) => {
    if (!url) return null;
    
    console.log(`[🎥 HeroCarousel] Analisando URL de vídeo: ${url}`);
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (videoIdMatch) {
        console.log(`  ✅ Detectado YouTube, ID: ${videoIdMatch[1]}`);
        return { type: 'youtube', id: videoIdMatch[1] };
      } else {
        console.warn(`  ⚠️ URL parece YouTube mas não conseguiu extrair ID`);
      }
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoIdMatch = url.match(/vimeo\.com\/(\d+)/);
      if (videoIdMatch) {
        console.log(`  ✅ Detectado Vimeo, ID: ${videoIdMatch[1]}`);
        return { type: 'vimeo', id: videoIdMatch[1] };
      }
    }
    
    // MP4 direto
    if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
      console.log(`  ✅ Detectado vídeo MP4 direto`);
      return { type: 'mp4', url };
    }
    
    console.warn(`  ❌ Tipo de vídeo não reconhecido: ${url}`);
    return null;
  };
  
  const videoInfo = hasAnyVideo ? getVideoType(currentProperty?.video_url) : null;
  const hasVideo = videoInfo && !videoError;

  // Reset video error when slide changes
  useEffect(() => {
    setVideoError(false);
  }, [currentIndex]);

  // Auto-play vídeo MP4 quando muda de slide
  useEffect(() => {
    if (hasVideo && videoInfo?.type === 'mp4') {
      const videoElement = document.getElementById(`hero-video-${currentIndex}`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.play().catch(() => {
          // Ignore autoplay errors (browser policy)
        });
      }
    }
  }, [currentIndex, hasVideo, videoInfo]);

  const price = currentProperty?.price
    ? currentProperty.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
    : "Preço sob consulta";

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % properties.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section className="relative h-[450px] w-full overflow-hidden md:h-[520px]">
      {/* Background Image ou Video */}
      {hasVideo && videoInfo ? (
        <>
          {videoInfo.type === 'youtube' && (
            <iframe
              key={`youtube-${currentIndex}`}
              src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&mute=1&loop=1&playlist=${videoInfo.id}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              className="absolute inset-0 h-full w-full object-cover"
              allow="autoplay; encrypted-media"
              style={{ border: 'none', pointerEvents: 'none' }}
              onError={() => {
                console.error('Erro ao carregar vídeo YouTube:', currentProperty.reference);
                setVideoError(true);
              }}
            />
          )}
          
          {videoInfo.type === 'vimeo' && (
            <iframe
              key={`vimeo-${currentIndex}`}
              src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&muted=1&loop=1&background=1`}
              className="absolute inset-0 h-full w-full object-cover"
              allow="autoplay; fullscreen"
              style={{ border: 'none', pointerEvents: 'none' }}
              onError={() => {
                console.error('Erro ao carregar vídeo Vimeo:', currentProperty.reference);
                setVideoError(true);
              }}
            />
          )}
          
          {videoInfo.type === 'mp4' && (
            <video
              id={`hero-video-${currentIndex}`}
              src={videoInfo.url}
              poster={heroImage}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              onError={(e) => {
                console.error('Erro ao carregar vídeo MP4:', currentProperty.reference, e);
                setVideoError(true);
              }}
            />
          )}
        </>
      ) : (
        <div
          className="absolute inset-0 h-full w-full bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
          }}
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

      {/* Main Content */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2 md:bottom-10 md:left-16 md:right-auto md:max-w-xl md:space-y-4">
        {currentProperty?.reference && (
          <span className="inline-block rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E10600] md:px-3 md:py-1 md:text-xs">
            {currentProperty.reference}
          </span>
        )}
        <h1 className="text-xl font-semibold leading-tight md:text-5xl">
          {currentProperty?.title || "Descobre imóveis que valem o prime time"}
        </h1>
        <p className="text-xs text-[#C5C5C5] md:text-sm">
          {currentProperty
            ? `${currentProperty.typology || currentProperty.property_type || "Propriedade"} • ${price} • ${
                currentProperty.location || currentProperty.municipality || "Localização reservada"
              }`
            : "Seleção semanal com curadoria de especialistas, disponível em catálogo imersivo ao estilo Netflix."}
        </p>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {currentProperty ? (
            <Link
              href={`/imovel/${encodeURIComponent(currentProperty.reference || currentProperty.title || `imovel-${currentProperty.id}`)}`}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black shadow-lg shadow-[#E10600]/40 transition hover:scale-105 md:px-6 md:py-3 md:text-sm"
            >
              Ver detalhes
            </Link>
          ) : (
            <Link
              href="/imoveis"
              className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black shadow-lg shadow-[#E10600]/40 md:px-6 md:py-3 md:text-sm"
            >
              Ver catálogo completo
            </Link>
          )}
          <Link
            href="/imoveis?f=arrendar"
            className="hidden rounded-full border border-white/30 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-white hover:bg-white/10 md:inline-block md:px-6 md:py-3 md:text-sm"
          >
            Imóveis para arrendamento
          </Link>
        </div>
      </div>

      {/* Property Thumbnails - Bottom Right */}
      <div className="absolute bottom-10 right-6 hidden gap-2 md:flex md:right-16">
        {properties.slice(0, 3).map((property, idx) => (
          <button
            key={property.id}
            onClick={() => {
              setCurrentIndex(idx);
            }}
            className={`group relative h-16 w-24 overflow-hidden rounded-lg border-2 transition ${
              idx === currentIndex ? "border-[#E10600] scale-110" : "border-white/20 hover:border-white/50"
            }`}
          >
            <SafeImage
              src={getPropertyCover(property)}
              alt={property.title}
              fill
              className="object-cover"
              sizes="100px"
            />
            {idx === currentIndex && (
              <div className="absolute inset-0 bg-[#E10600]/20 ring-2 ring-[#E10600]" />
            )}
          </button>
        ))}
      </div>

      {/* Navigation Arrows */}
      {properties.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70 md:left-4 md:p-3"
            aria-label="Imóvel anterior"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70 md:right-4 md:p-3"
            aria-label="Próximo imóvel"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Navigation (Mobile) */}
      {properties.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2 md:hidden">
          {properties.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-2 w-2 rounded-full transition ${
                idx === currentIndex ? "bg-[#E10600] w-6" : "bg-white/50"
              }`}
              aria-label={`Ir para imóvel ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
