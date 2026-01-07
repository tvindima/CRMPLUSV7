'use client';

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export type TeamMember = {
  id: number | string;
  name: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  email?: string;
  isAgent?: boolean;
  team?: string | null;
};

type Props = {
  title: string;
  eyebrow?: string;
  members: TeamMember[];
};

// Normalizar nome para slug (remover acentos e caracteres especiais)
function normalizeForSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, "-"); // Espaços por hífens
}

export function TeamCarousel({ title, eyebrow, members }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--color-primary)' }}>{eyebrow}</p>
          )}
          <h2 className="text-xl font-semibold md:text-2xl" style={{ color: 'var(--color-text)' }}>{title}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="rounded-full p-2 transition"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            aria-label="Anterior"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="rounded-full p-2 transition"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            aria-label="Seguinte"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {members.map((member) => (
          <TeamCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const slug = normalizeForSlug(member.name);
  const href = member.isAgent ? `/agentes/${slug}` : "#";
  
  const CardContent = (
    <div 
      className="group relative h-[380px] w-[280px] flex-shrink-0 overflow-hidden rounded-2xl"
      style={{ backgroundColor: 'var(--color-background-secondary)' }}
    >
      {/* Avatar Background */}
      <div className="absolute inset-0">
        <Image
          src={member.avatar || "/avatars/placeholder.png"}
          alt={member.name}
          fill
          className="object-contain object-bottom transition duration-500 group-hover:scale-105"
          sizes="280px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-base font-semibold md:text-xl" style={{ color: 'var(--color-text)' }}>{member.name}</h3>
        <p className="text-sm" style={{ color: 'var(--color-primary)' }}>{member.role}</p>
        {member.phone && (
          <a
            href={`tel:${member.phone.replace(/\s/g, "")}`}
            className="mt-2 flex items-center gap-2 text-sm transition"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {member.phone}
          </a>
        )}
        {member.team && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Equipa: {member.team}</p>
        )}
      </div>

      {/* Hover indicator for agents */}
      {member.isAgent && (
        <div 
          className="absolute right-4 top-4 rounded-full p-2 opacity-0 transition group-hover:opacity-100"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      )}
    </div>
  );

  if (member.isAgent) {
    return (
      <Link href={href} className="block">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

export default TeamCarousel;
