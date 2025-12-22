'use client';

import { useState } from 'react';

type Props = {
  videoUrl?: string | null;
  propertyTitle: string;
};

export function PropertyVideo({ videoUrl, propertyTitle }: Props) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);

  if (!videoUrl) {
    return null;
  }

  // Extract YouTube video ID if it's a YouTube URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Check if it's a Vimeo URL
  const getVimeoId = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(videoUrl);
  const vimeoId = getVimeoId(videoUrl);
  
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
    : vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1`
    : videoUrl;

  return (
    <>
      <button
        onClick={() => setShowVideo(true)}
        className="flex items-center gap-2 rounded-xl bg-[#0B0B0D]/70 px-4 py-3 text-sm font-semibold text-white ring-1 ring-[#1F1F22] transition hover:ring-[#E10600]"
      >
        <svg className="h-5 w-5 text-[#E10600]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        Ver vídeo do imóvel
      </button>

      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setShowVideo(false)}
        >
          <button
            onClick={() => setShowVideo(false)}
            className="absolute right-6 top-6 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="relative aspect-video w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {youtubeId ? (
              <iframe
                src={embedUrl}
                title={`Vídeo do imóvel: ${propertyTitle}`}
                className="h-full w-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : vimeoId ? (
              <iframe
                src={embedUrl}
                title={`Vídeo do imóvel: ${propertyTitle}`}
                className="h-full w-full rounded-xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                {!videoError ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    className="h-full w-full rounded-xl"
                    onError={() => {
                      console.error('Erro ao carregar vídeo:', videoUrl);
                      setVideoError(true);
                    }}
                  >
                    O seu browser não suporta vídeo.
                  </video>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#151518] p-8 text-center">
                    <div>
                      <svg className="mx-auto h-16 w-16 text-[#E10600]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-4 text-[#C5C5C5]">
                        Não foi possível carregar o vídeo.
                      </p>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-[#E10600] hover:underline"
                      >
                        Abrir em nova janela
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
