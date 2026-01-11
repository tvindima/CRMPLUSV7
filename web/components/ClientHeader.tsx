'use client';

import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { useTerminology } from '@/contexts/TerminologyContext';
import { BrandImage } from './BrandImage';
import UserMenuWrapper from './UserMenuWrapper';
import MobileMenu from './MobileMenu';

export function ClientHeader() {
  const { branding, loading } = useBranding();
  const { terms } = useTerminology();

  // Links de navegação dinâmicos baseados no sector
  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/imoveis", label: terms.menuItems },
    { href: "/empreendimentos", label: terms.menuDevelopments },
    { href: "/agentes", label: terms.menuTeam },
    { href: "/contactos", label: terms.menuContact },
  ];

  return (
    <header 
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{ 
        borderColor: branding.border_color,
        backgroundColor: `${branding.background_color}CC` // CC = 80% opacity
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo - Simplificado em mobile */}
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <BrandImage 
            src={branding.agency_logo_url || "/brand/agency-logo-default.svg"}
            alt={branding.agency_name}
            width={180} 
            height={60} 
            className="h-14 w-auto object-contain md:h-16" 
          />
          <div className="hidden sm:block">
            <p 
              className="text-xs uppercase tracking-wide md:text-sm"
              style={{ color: branding.primary_color }}
            >
              {loading ? '...' : branding.agency_name}
            </p>
            <p 
              className="hidden text-xs md:block"
              style={{ color: branding.text_muted }}
            >
              {loading ? '...' : branding.agency_slogan}
            </p>
          </div>
          {/* Texto simplificado mobile */}
          <p 
            className="text-xs uppercase tracking-wide sm:hidden"
            style={{ color: branding.primary_color }}
          >
            {loading ? '...' : branding.agency_name}
          </p>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden items-center gap-2 md:flex lg:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-2 py-2 text-sm transition hover:text-white lg:px-3"
              style={{ color: branding.secondary_color }}
            >
              {link.label}
            </Link>
          ))}
          {/* Botão de login visível só em desktop */}
          <div className="hidden md:block">
            <UserMenuWrapper />
          </div>
        </nav>

        {/* UserMenuWrapper sempre presente para o modal funcionar em mobile */}
        <div className="md:hidden">
          <UserMenuWrapper />
        </div>

        {/* Mobile Menu */}
        <MobileMenu links={navLinks} />
      </div>
    </header>
  );
}
