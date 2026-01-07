'use client';

import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { BrandImage } from './BrandImage';

export function DynamicBrandLogo() {
  const { branding, loading } = useBranding();

  return (
    <Link href="/" className="flex items-center gap-2 md:gap-3">
      <BrandImage 
        src={branding.agency_logo_url || "/brand/agency-logo.svg"}
        alt={branding.agency_name}
        width={32} 
        height={32}
        className="h-7 w-7 md:h-8 md:w-8" 
      />
      <div className="hidden sm:block">
        <p 
          className="text-xs uppercase tracking-wide md:text-sm"
          style={{ color: 'var(--color-primary)' }}
        >
          {loading ? '...' : branding.agency_name}
        </p>
        <p 
          className="hidden text-xs md:block"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {loading ? '...' : branding.agency_slogan}
        </p>
      </div>
      <p 
        className="text-xs uppercase tracking-wide sm:hidden"
        style={{ color: 'var(--color-primary)' }}
      >
        {loading ? '...' : branding.agency_name}
      </p>
    </Link>
  );
}

export function DynamicBrandFooterLogo() {
  const { branding, loading } = useBranding();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <BrandImage 
        src={branding.agency_logo_url || "/brand/agency-logo.svg"}
        alt={branding.agency_name}
        width={120} 
        height={32}
        className="h-6 md:h-8"
        style={{ width: 'auto', height: '1.5rem' }}
      />
      <p 
        className="text-xs sm:text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {loading ? '...' : branding.agency_slogan}
      </p>
    </div>
  );
}
