'use client';

import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { BrandImage } from './BrandImage';
import UserMenuWrapper from './UserMenuWrapper';
import MobileMenu from './MobileMenu';

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/empreendimentos", label: "Empreendimentos" },
  { href: "/agentes", label: "Equipa" },
  { href: "/contactos", label: "Contactos" },
];

export function ClientHeader() {
  const { branding, loading } = useBranding();

  return (
    <header className="sticky top-0 z-20 border-b border-[#2A2A2E] bg-[#0B0B0D]/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo - Simplificado em mobile */}
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <BrandImage 
            src={branding.agency_logo_url || "/brand/agency-logo.svg"}
            alt={branding.agency_name}
            width={32} 
            height={32} 
            className="h-7 w-7 md:h-8 md:w-8" 
          />
          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-wide text-[#E10600] md:text-sm">
              {loading ? '...' : branding.agency_name}
            </p>
            <p className="hidden text-xs text-[#C5C5C5] md:block">
              {loading ? '...' : branding.agency_slogan}
            </p>
          </div>
          {/* Texto simplificado mobile */}
          <p className="text-xs uppercase tracking-wide text-[#E10600] sm:hidden">
            {loading ? '...' : branding.agency_name}
          </p>
        </Link>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden items-center gap-2 md:flex lg:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-2 py-2 text-sm text-[#C5C5C5] transition hover:text-white hover:shadow-[0_0_10px_#E10600] lg:px-3"
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
