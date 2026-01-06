'use client';

import Link from 'next/link';
import { useBranding } from '@/contexts/BrandingContext';
import { BrandImage } from './BrandImage';

export function ClientFooter() {
  const { branding, loading } = useBranding();

  return (
    <footer className="border-t border-[#2A2A2E] bg-[#0B0B0D] py-6 md:py-8">
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
          <p className="text-xs text-[#C5C5C5] sm:text-sm">
            {loading ? '...' : branding.agency_slogan}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-xs text-[#C5C5C5] sm:flex-row sm:items-center sm:gap-4 md:text-sm">
          <span className="text-[10px] text-[#7A7A7A] md:text-xs">Powered by CRM PLUS</span>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link href="/privacidade" className="hover:text-white">
              Privacidade
            </Link>
            <Link href="/cookies" className="hover:text-white">
              Cookies
            </Link>
            <Link href="/termos" className="hover:text-white">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
