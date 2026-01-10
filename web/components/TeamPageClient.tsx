'use client';

import { useTerminology } from '@/contexts/TerminologyContext';
import { useBranding } from '@/contexts/BrandingContext';
import TeamCarousel, { TeamMember } from './TeamCarousel';

interface TeamPageClientProps {
  agentMembers: TeamMember[];
  staffMembers: TeamMember[];
}

export function TeamPageClient({ agentMembers, staffMembers }: TeamPageClientProps) {
  const { terms, sector } = useTerminology();
  const { branding } = useBranding();

  // Ajustar roles dos agentes baseado no sector
  const adjustedAgentMembers = agentMembers.map(member => ({
    ...member,
    role: sector === 'real_estate' ? 'Consultor Imobiliário' : 
          sector === 'automotive' ? 'Comercial' :
          sector === 'boats' ? 'Consultor Náutico' :
          'Comercial',
  }));

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.3em]" style={{ color: 'var(--color-primary)' }}>A Nossa Equipa</p>
        <h1 className="mt-2 text-2xl font-bold text-white md:text-5xl">
          {terms.teamTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
          {terms.teamSubtitle}
        </p>
      </section>

      {/* Consultores Carousel */}
      <TeamCarousel
        eyebrow={terms.agents}
        title={terms.agentsDescription}
        members={adjustedAgentMembers}
      />

      {/* Staff Carousel */}
      <TeamCarousel
        eyebrow="Backoffice"
        title="Equipa de suporte"
        members={staffMembers}
      />

      {/* CTA Section */}
      <section 
        className="rounded-3xl border p-8 text-center md:p-12"
        style={{ 
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(to bottom right, var(--color-background-secondary), var(--color-background))'
        }}
      >
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          Quer fazer parte da nossa equipa?
        </h2>
        <p className="mx-auto mt-4 max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
          Estamos sempre à procura de talentos para se juntarem à família {branding.agency_name}.
          Se tem paixão pelo {sector === 'real_estate' ? 'imobiliário' : sector === 'automotive' ? 'automóvel' : 'nosso sector'}, entre em contacto connosco.
        </p>
        <a
          href="/contactos"
          className="mt-6 inline-block rounded-full px-6 py-2.5 font-semibold text-white transition hover:brightness-85 md:px-8 md:py-3"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Contacte-nos
        </a>
      </section>
    </div>
  );
}
