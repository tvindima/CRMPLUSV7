'use client';

import { useEffect } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { LeadForm } from './LeadForm';
import { SectionHeader } from './SectionHeader';

export function ContactPageClient() {
  const { branding } = useBranding();

  // Atualizar título da página
  useEffect(() => {
    document.title = 'Contactos';
  }, []);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Contacto"
        title="Fala com a agência"
        subtitle="Estamos disponíveis para ajudar."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Contactos diretos</p>
          {branding.phone && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Telefone: <a href={`tel:${branding.phone}`} className="hover:underline">{branding.phone}</a>
            </p>
          )}
          {branding.email && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Email: <a href={`mailto:${branding.email}`} className="hover:underline">{branding.email}</a>
            </p>
          )}
          {branding.address && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Morada: {branding.address}</p>
          )}
          {!branding.phone && !branding.email && !branding.address && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Contactos em atualização...</p>
          )}
        </div>
        <LeadForm source="contactos" />
      </div>
    </div>
  );
}
