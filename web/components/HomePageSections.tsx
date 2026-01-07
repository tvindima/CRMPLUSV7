"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { CarouselHorizontal } from "./CarouselHorizontal";
import { PropertyRailCard } from "./PropertyCards";
import type { Property } from "../src/services/publicApi";

interface RailSectionProps {
  title: string;
  showRanking?: boolean;
  filterQuery?: string;
  items: Property[];
  totalItems: number;
  maxItemsPerRail: number;
}

export function RailSection({ 
  title, 
  showRanking, 
  filterQuery, 
  items, 
  totalItems, 
  maxItemsPerRail 
}: RailSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4 px-6">
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: 'var(--color-primary)' }}
          >
            {title.includes("Top") ? "Top 10" : "Coleção"}
          </p>
          <h3 
            className="text-2xl font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            {title}{" "}
            <span 
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ({totalItems} imóveis)
            </span>
          </h3>
        </div>
        {totalItems > maxItemsPerRail && (
          <Link href={`/imoveis${filterQuery}`} legacyBehavior>
            <a
              className="flex items-center gap-2 text-sm font-semibold transition"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            >
              Ver Todos
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </Link>
        )}
      </div>
      <CarouselHorizontal>
        {items.map((property, idx) => (
          <div key={`${title}-${property.id}`} className="snap-center pr-2 sm:pr-3">
            <PropertyRailCard property={property} index={idx} showRanking={showRanking} />
          </div>
        ))}
      </CarouselHorizontal>
    </div>
  );
}

interface ContactSectionProps {
  children: ReactNode;
}

export function ContactSection({ children }: ContactSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6">
      <div 
        className="grid gap-6 rounded-3xl p-6 md:grid-cols-[1.1fr_0.9fr]"
        style={{
          backgroundColor: 'var(--color-background-secondary)',
          borderColor: 'var(--color-border)',
          borderWidth: '1px',
        }}
      >
        <div className="space-y-3">
          <p 
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: 'var(--color-primary)' }}
          >
            Curadoria pessoal
          </p>
          <h2 
            className="text-3xl font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            Fala com o nosso studio e recebe sugestões privadas
          </h2>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Mantemos o espírito "para si" com uma seleção privada enviada via e-mail ou chamada. Sem listas de agentes nesta zona—
            apenas experiências imersivas focadas em si.
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}
