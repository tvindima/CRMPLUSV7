'use client';

import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { BrandImage } from './BrandImage';

export function ClientFooter() {
  const { branding, loading } = useBranding();

  return (
    <footer 
      className="border-t py-6 md:py-8"
      style={{ 
        borderColor: branding.border_color,
        backgroundColor: branding.background_color
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <BrandImage 
            src={branding.agency_logo_url || "/brand/agency-logo.svg"}
            alt={branding.agency_name}
            width={120} 
            height={32} 
            className="h-6 md:h-8" 
            style={{ width: 'auto', height: '1.5rem' }}
          />
          <p className="text-xs sm:text-sm" style={{ color: branding.text_muted }}>
            {loading ? '...' : branding.agency_slogan}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:gap-4 md:text-sm">
          <span className="text-[10px] md:text-xs" style={{ color: branding.text_muted, opacity: 0.7 }}>
            Powered by CRM PLUS
          </span>
          <div className="flex flex-wrap gap-3 sm:gap-4" style={{ color: branding.text_muted }}>
            <Link href="/privacidade" className="hover:opacity-80" style={{ color: branding.secondary_color }}>
              Privacidade
            </Link>
            <Link href="/cookies" className="hover:opacity-80" style={{ color: branding.secondary_color }}>
              Cookies
            </Link>
            <Link href="/termos" className="hover:opacity-80" style={{ color: branding.secondary_color }}>
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
