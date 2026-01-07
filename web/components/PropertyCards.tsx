"use client";

import Link from "next/link";
import { SafeImage } from "./SafeImage";
import { getPropertyCover, getPlaceholderImage } from "../src/utils/placeholders";
import type { Property } from "../src/services/publicApi";

const getImage = (property?: Property) => {
  if (property) return getPropertyCover(property as any);
  return getPlaceholderImage("hero");
};

interface RailCardProps {
  property: Property;
  index: number;
  showRanking?: boolean;
}

export function PropertyRailCard({ property, index, showRanking }: RailCardProps) {
  const price = property.price 
    ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) 
    : "Preço sob consulta";

  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative min-w-[160px] sm:min-w-[200px] md:min-w-[220px] snap-start overflow-hidden rounded-xl md:rounded-2xl transition hover:-translate-y-1"
      style={{
        backgroundColor: 'var(--color-background-secondary)',
      }}
    >
      <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden">
        <SafeImage
          src={getImage(property)}
          alt={property.title || 'Property'}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.05]"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 40vw, 240px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {showRanking && (
          <span className="absolute left-3 top-3 text-5xl font-extrabold text-white/30 drop-shadow-lg">{index + 1}</span>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
          {property.reference && (
            <span 
              className="mb-1 inline-block rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-primary)' }}
            >
              {property.reference}
            </span>
          )}
          <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1">
            {property.title || property.reference}
          </p>
          <p 
            className="text-[10px] sm:text-xs line-clamp-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {property.location || property.municipality || "Localização reservada"}
          </p>
        </div>
      </div>
      <div 
        className="flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 md:py-3 text-[10px] sm:text-xs"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <span 
          className="font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          {price}
        </span>
        {property.typology && <span>{property.typology}</span>}
      </div>
    </Link>
  );
}

interface SpotlightCardProps {
  property: Property;
}

export function PropertySpotlightCard({ property }: SpotlightCardProps) {
  const price = property.price 
    ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) 
    : "Preço sob consulta";

  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative overflow-hidden rounded-[24px] bg-gradient-to-b from-white/5 to-transparent"
      style={{
        borderColor: 'var(--color-border)',
        borderWidth: '1px',
      }}
    >
      <div className="relative h-64 w-full overflow-hidden">
        <SafeImage
          src={getImage(property)}
          alt={property.title || 'Property'}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 90vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
        <p 
          className="text-sm uppercase tracking-[0.3em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Destaque
        </p>
        {property.reference && (
          <span 
            className="mb-2 inline-block w-fit rounded bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-primary)' }}
          >
            {property.reference}
          </span>
        )}
        <h3 className="text-lg font-semibold text-white md:text-2xl">
          {property.title || property.reference}
        </h3>
        <div 
          className="mt-2 flex flex-wrap gap-3 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <span>{property.typology || property.property_type || "Tipologia —"}</span>
          <span>{price}</span>
          <span>{property.location || property.municipality || "Localização reservada"}</span>
        </div>
      </div>
    </Link>
  );
}

export function PropertySpotlightCardVertical({ property }: SpotlightCardProps) {
  const price = property.price 
    ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) 
    : "Preço sob consulta";

  return (
    <Link
      href={`/imovel/${encodeURIComponent(property.reference || property.title || `imovel-${property.id}`)}`}
      className="group relative block overflow-hidden rounded-[24px] bg-gradient-to-b from-white/5 to-transparent transition hover:-translate-y-1"
      style={{
        borderColor: 'var(--color-border)',
        borderWidth: '1px',
      }}
    >
      <div className="relative h-80 w-full overflow-hidden">
        <SafeImage
          src={getImage(property)}
          alt={property.title || 'Property'}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <span 
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Destaque
        </span>
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-5">
        <h3 className="text-base font-semibold text-white line-clamp-2 md:text-xl">
          {property.title || property.reference}
        </h3>
        <div 
          className="mt-2 space-y-1 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <p>{property.typology || property.property_type || "Tipologia —"}</p>
          <p className="font-semibold text-white">{price}</p>
          <p className="text-xs">{property.location || property.municipality || "Localização reservada"}</p>
        </div>
      </div>
    </Link>
  );
}
