'use client';

import { useState } from 'react';

type Props = {
  location: string;
  municipality?: string | null;
  parish?: string | null;
};

export function PropertyMap({ location, municipality, parish }: Props) {
  const [showMap, setShowMap] = useState(false);
  
  const fullAddress = [location, parish, municipality, 'Portugal']
    .filter(Boolean)
    .join(', ');
  
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Localização</h3>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-sm text-[#E10600] hover:underline"
        >
          {showMap ? 'Esconder mapa' : 'Ver no mapa'}
        </button>
      </div>
      
      <p className="text-sm text-[#C5C5C5]">{fullAddress}</p>
      
      {showMap && (
        <div className="overflow-hidden rounded-xl">
          <iframe
            src={mapUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded-xl"
          />
        </div>
      )}
      
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-[#4b9dff] hover:underline"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Abrir no Google Maps
      </a>
    </div>
  );
}
