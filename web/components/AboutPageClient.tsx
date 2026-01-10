'use client';

import { useEffect } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { useTerminology } from '@/contexts/TerminologyContext';

export function AboutPageClient() {
  const { branding } = useBranding();
  const { sector } = useTerminology();

  // Atualizar título da página
  useEffect(() => {
    document.title = `Sobre - ${branding.agency_name || 'Nós'}`;
  }, [branding.agency_name]);

  // Serviços baseados no sector
  const getServices = () => {
    switch (sector) {
      case 'automotive':
        return [
          'Compra e venda de veículos.',
          'Troca e retoma de usados.',
          'Financiamento automóvel.',
          'Consultoria e avaliação.',
        ];
      case 'boats':
        return [
          'Compra e venda de embarcações.',
          'Consultoria náutica.',
          'Avaliação e peritagem.',
        ];
      case 'machinery':
        return [
          'Compra e venda de máquinas e equipamentos.',
          'Aluguer de maquinaria.',
          'Consultoria técnica.',
        ];
      default:
        return [
          'Compra e venda de imóveis.',
          'Arrendamento e gestão.',
          'Consultoria imobiliária e avaliação.',
        ];
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>Sobre</p>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>{branding.agency_name || 'A Nossa Empresa'}</h1>
        {branding.agency_slogan && (
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{branding.agency_slogan}</p>
        )}
      </div>
      <div className="space-y-3 rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>Serviços</h2>
        <ul className="list-disc space-y-2 pl-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {getServices().map((service, i) => (
            <li key={i}>{service}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
